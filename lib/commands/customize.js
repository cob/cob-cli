const inquirer = require('inquirer');
const colors = require("colors");
const path = require("path");
const { checkRepoVersion } = require("./upgradeRepo");
const { checkWorkingCopyCleanliness } = require("../task_lists/common_helpers");
const axios = require("axios");
const git = require("simple-git");
const ncp = require("ncp");
const { Transform } = require("stream");
const fs = require("fs-extra");

const customizationsVersionsFile = "customizations.json";
const filesToMerge = [] ; // don't move this to the copyAndMerge method; it will behave erratically

/* ************************************************************************ */
async function customize(filter, args) {
  try {
    console.log("Customize...");

    if (args.cache && (filter || args.local || args.update)) throw new Error("\nError: ".red + " incompatible options. Use --cache as single argument\n");
    if (args.update && filter ) throw new Error("\nError: ".red + " incompatible options. Use --update without a <filter> \n");

    if (!args.cache) checkRepoVersion();
    if (!args.cache && !args.force) await checkWorkingCopyCleanliness();

    const customizations = await getCustomizationsList(filter, args)
    if(!args.local) {
      await downloadCustomizationFiles(customizations,args)
      if(args.cache) {
        console.log( colors.green("\nDone"), " - All configuration were downloaded to your local cache and you can now use the --local flag for any customization" );
        // For --cache argument all work is done, just return
        return
      }
    }
    await applyCustomizations(customizations)

    console.log( colors.green("\nDone"), "\nCheck changes to your git working tree and try:" );
    console.log( "\tcob-cli test\n" );
  } catch (err) {
    console.error("\n", err.message);
  }
}
module.exports = customize;

/* ************************************************************************ */
async function getCustomizationsList(filter, args) {
  const { xdgData } = await import("xdg-basedir");
  const cacheCustomizationsFile = path.resolve(xdgData,"cob-cli","customizations.json")

  let customizationRepos;
  let customizationNameQuery = "customize. " + (filter ? filter : "");
  if (args.local) {
    customizationRepos = JSON.parse(fs.readFileSync(cacheCustomizationsFile))
    if (filter) {
      customizationRepos = customizationRepos.filter(customizationRepo => customizationRepo.name.indexOf(filter) != -1)
    }
  } else {
    // Get list of relevant customizations from github
    const response = await axios.get( "https://api.github.com/search/repositories?q=" + customizationNameQuery + "+in:name+org:cob", { headers: { Accept: "application/json", "Accept-Encoding": "identity" } } )
    customizationRepos = response.data.items
  }

  // Throw error if there's no customization
  if (customizationRepos.length == 0) throw new Error("\nError: ".red + " no customization found\n");

  //Filter customizations according to argument flags
  let relevantRepoNames = [];

  if (args.update) {
    // If --update then filter is existing customizations
    let customizationsVersions = {};
    if(fs.existsSync(customizationsVersionsFile)) {
      const customizationsVersionsRawData = fs.readFileSync(customizationsVersionsFile);
      customizationsVersions = JSON.parse(customizationsVersionsRawData);
    }
    relevantRepoNames = Object.keys(customizationsVersions)

  } else if (!args.cache) {
    // Otherwise, if not --cache, asks for customizations to apply
    let answer = await inquirer.prompt([
      {
        type: "checkbox",
        name: "customizations",
        message: "What customization do you want to apply?",
        choices: customizationRepos.map((customizationRepo) => customizationRepo.name).sort(),
        validate: (answers) => answers.length > 0
      },
    ]);
    relevantRepoNames = answer.customizations
  }

  //Return the full customizationRepo info for relevant repos
  return customizationRepos
      .sort( (c1, c2) => c1.name > c2.name)
      .filter( customizationRepo => relevantRepoNames.length == 0 || relevantRepoNames.indexOf(customizationRepo.name) >= 0);
}

/* ************************************************************************ */
async function downloadCustomizationFiles(customizationRepos, args) {
  const { xdgData } = await import("xdg-basedir");
  const baseDir = process.cwd();
  const cacheDir = path.resolve(xdgData,"cob-cli")
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  if(args.cache) {
    const cacheCustomizationsFile = path.resolve(cacheDir, "customizations.json")
    fs.writeFileSync(cacheCustomizationsFile, JSON.stringify(customizationRepos, null, 2), (err) =>  {
          if(err) throw new Error("\nError: ".red + " problem writing " + cacheCustomizationsFile + ":", err.message);
        }
    );
  }

  for (const customizationRepo of customizationRepos) {
    process.chdir(cacheDir);
    if (!fs.existsSync(path.resolve(cacheDir,customizationRepo.name))) {
      console.log("  git clone " + customizationRepo.clone_url);
      await git().clone(customizationRepo.clone_url);

    } else {
      console.log("  git pull " + customizationRepo.clone_url);
      process.chdir(customizationRepo.name);
      try {
        await git().pull();
      } catch (error) { }
    }
  }
  process.chdir(baseDir);

}

/* ************************************************************************ */
async function applyCustomizations(customizationRepos) {
  console.log("\n  Applying " + customizationRepos.map( c => colors.blue(c.name)) + " customization ...");

  const { xdgData } = await import("xdg-basedir");
  for (let customizationRepo of customizationRepos) {
    const customizationDir = path.resolve( xdgData, "cob-cli", customizationRepo.name);
    const customizationFile = path.resolve( customizationDir, "customize.js");
    if (!fs.existsSync(customizationFile)) throw new Error("\nError: ".red + " no customize.js file found\n");

    let customization = (await import(customizationFile)).default;

    // Asks questions, if question configuration exists
    let answers = {};
    if (customization.questions) {
      answers = await inquirer.prompt(customization.questions);
    }

    // Apply specific customization, if actions exist, otherwise use default actions
    if (customization.actions) {
      await customization.actions(customizationRepo.name, answers, copyAndMerge);
    } else {
      // Default actions
      copyAndMerge(customizationRepo.name, customizationDir, answers);
    }

    // Update customizations.json file
    await updateCustomizationsVersions(customizationRepo.name, customization.version);
  }
}

/* ************************************************************************ */
function copyAndMerge(customizationRepoName, source, substitutions = {}) {
  console.log("\n  Copying template files for " + colors.blue(customizationRepoName) + "...");

  let excludedFiles = RegExp(
      "(" +
      source + "/\\.git.*" +
      "|" +
      source + "/.*\\.DS_Store" +
      "|" +
      source + "/README.*" +
      "|" +
      source + "/customize.js" +
      "|" +
      source + ".*/node_modules/" +
      "|" +
      source + "/.*\\.sh" +
      "|" +
      source + ".*/pom.xml" +
      "|" +
      source + ".*/target/" +
      "|" +
      source + ".*/test/" +
      ")"
  );

  // Source is on cob-cli customizationRepo and Destination on the server repo
  const target = process.cwd() // Always copy to directory where command is being executed, ie, the root directory of the server repo
  const substitutionRegex = /__(((?!word).)*)__/g;
  ncp(
      source,
      target,
      {
        clobber: true,
        filter: (src) => src.match(excludedFiles) == null,
        rename: function(target) {
          // Don't rename __MERGE__ templates, they will be handled by the merge method
          if (target.match(/__MERGE__/)) {
            const newTmpName = target.replace(/__MERGE__/, customizationRepoName+"__MERGE__")
            filesToMerge.push({name:newTmpName, block: customizationRepoName})
            return newTmpName
          };

          //get finalTarget from target with any existing substitution
          const finalTarget = target.replace(substitutionRegex, (match,g1) => substitutions[g1] ? substitutions[g1] : match);

          //if the directory of finalTarget doesn't exists it means that a replacement ocurred on the dirpath (ie, there was a /__.+__/ was on the dirpath), in which case we need to create the desired directory and remove the one just created by ncp
          if (!fs.existsSync(path.dirname(finalTarget))) {
            fs.mkdirSync(path.dirname(finalTarget), { recursive: true })
            fs.rmdirSync(target.substring(0,target.lastIndexOf("__")+2), { recursive: true,force: false }) //NOTE: won't handle more than 1 substitution on the same dirpath
          }
          return finalTarget;
        },
        transform(read, write) {
          const replaceVarsTransformFunction = new Transform({
            transform: (chunk, encoding, done) => {
              if(/\ufffd/.test(chunk) === true) {
                // If chunk is binary don't change anything
                done(null, chunk)
              } else {
                // Otherwise change any existing substitution
                done(null,chunk.toString().replace(substitutionRegex, (match,g1) => substitutions[g1] ? substitutions[g1] : match))
              }
            }
          })
          read.pipe(replaceVarsTransformFunction).pipe(write)
        }
      },
      (error) => {
        if(error) {
          console.log(error.map((e) => e.message).join("\n"))
        } else {
          while(filesToMerge.length > 0) {
            let file = filesToMerge.pop();
            //Allow a little time for file to be written to disk
            setTimeout( () => mergeFiles(file.block, file.name), 200)
          }
        }
      }
  )
}

/* ************************************************************************ */
function mergeFiles(block,mergeFile) {
  if (!fs.existsSync(mergeFile)) {
    //Already processed
    return
  }

  let prodFileRexp =  new RegExp(block + "__MERGE__.");
  let prodFile = mergeFile.replace(prodFileRexp, "");
  let blockMark = block == undefined ? "" : block;
  if (!fs.existsSync(prodFile)) {
    // If prod file does not exist creates it
    console.log("  Creating " + prodFile);
    fs.closeSync(fs.openSync(prodFile, "w"));
  } else {
    console.log("  Merging " + prodFile + " " + block);
  }
  let prodFileContent = fs.readFileSync(prodFile).toString();
  let mergeFileContent = fs.readFileSync(mergeFile).toString();
  // With comments we support JS, CSS, GROOVY
  let startStr = "/* COB-CLI START " + blockMark + " */";
  let endStr = "\n/* COB-CLI END " + blockMark + " */";

  if (prodFileContent.indexOf(startStr) < 0) {
    // If previous customization does not exist
    prodFileContent = startStr + "\n" + mergeFileContent + endStr + "\n" + prodFileContent;
  } else {
    // If previous customization exists
    let beforeMerge = prodFileContent.indexOf(startStr);
    let afterMerge = prodFileContent.indexOf(endStr) + endStr.length;
    prodFileContent =
        prodFileContent.substring(0, beforeMerge) +
        startStr + "\n" +
        mergeFileContent +
        endStr +
        prodFileContent.substring(afterMerge);
  }
  fs.writeFileSync(prodFile, prodFileContent);

  fs.unlinkSync(mergeFile);
}

/* ************************************************************************ */
function updateCustomizationsVersions(customizationKey, version) {
  let customizationsVersions = {};
  if(fs.existsSync(customizationsVersionsFile)) {
    const customizationsVersionsRawData = fs.readFileSync(customizationsVersionsFile);
    customizationsVersions = JSON.parse(customizationsVersionsRawData);
  }
  if(customizationsVersions[customizationKey]) {
    customizationsVersions[customizationKey] = version
  } else {
    customizationsVersions = {[customizationKey]: version, ...customizationsVersions}
  }

  fs.writeFileSync(
      customizationsVersionsFile,
      JSON.stringify(customizationsVersions, null, 2),
      (err) => {
        if (err) console.log( "Error writing " + customizationsVersionsFile + ":", err.message );
      }
  );
}
