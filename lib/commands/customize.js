const inquirer = require('inquirer');
const colors = require("colors");
const path = require("path");
const { checkRepoVersion } = require("./upgradeRepo");
const { checkWorkingCopyCleanliness } = require("../task_lists/common_helpers");
const axios = require("axios");
const git = require("simple-git");
const ncp = require("ncp");
const { Transform } = require("stream");
const fg = require("fast-glob");
const fs = require("fs-extra");

const customizationsVersionsFile = "customizations.json";

/* ************************************************************************ */
async function customize(filter, args) {
  try {
    console.log("Customize...");
    if (!args.cache) checkVersion();
    if (!args.force && !args.cache) await checkWorkingCopyCleanliness();

    if (args.cache) {
      await cacheAllCustomizations(filter, args);
  
    } else if (args.update) {
      await updatePreviouslyAppliedCostumizations(filter, args);

    checkRepoVersion();
    if (!args.force) await checkWorkingCopyCleanliness();
      await applyCustomization(customizationRepo, args);
  
      console.log( colors.green("\nDone"), "\nCheck changes to your git working tree and try:" );
      console.log( "\tcob-cli test\n" );
    }

  } catch (err) {
    console.error("\n", err.message);
  }
}
module.exports = customize;

/* ************************************************************************ */
async function updatePreviouslyAppliedCostumizations(filter, args) {
  if (filter || args.cache) {
    throw new Error("\nError: ".red + " incompatible options. Use of --update with filter or --cache.\n");
  }
  console.log("Updating all installed customizations...");

  let customizationsVersions = {};
  if(fs.existsSync(customizationsVersionsFile)) {
    const customizationsVersionsRawData = fs.readFileSync(customizationsVersionsFile);
    customizationsVersions = JSON.parse(customizationsVersionsRawData);
  }

  const customizationRepos = await getCustomizationRepo(null, args);  
  for (let customizationRepo of customizationRepos) {
    if(customizationsVersions[customizationRepo.name]) {
      await applyCustomization(customizationRepo, args);
    }
  }
}

/* ************************************************************************ */
async function cacheAllCustomizations(filter, args) {
  if (filter || args.local || args.update) {
    throw new Error("\nError: ".red + " incompatible options. Use --cache as single argument\n");
  }
  
  console.log("Caching all customizations...");
  const customizationRepos = await getCustomizationRepo(null, args);  
  for (let customizationRepo of customizationRepos) {
    await downloadCustomizationFiles(customizationRepo);
  }

  const { xdgData } = await import("xdg-basedir");
  const cacheCustomizationsFile = path.resolve(xdgData, "cob-cli", "customizations.json")
  fs.writeFileSync(cacheCustomizationsFile,
    JSON.stringify(customizationRepos, null, 2),
    (err) =>  {
      if(err) throw new Error("\nError: ".red + " problem writing " + cacheCustomizationsFile + ":", err.message);
    }
  );
}

/* ************************************************************************ */
async function getCustomizationRepo(filter, args) {
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

  //If the goal is to cache or update customizations just return all customizations
  if (args.cache || args.update) {
    return customizationRepos;
  } 


  // Throw error if there's no customization
  if (customizationRepos.length == 0) throw new Error("\nError: ".red + " no customization found\n");
  
  // Otherwise asks for customization to apply
  let answer = await inquirer.prompt([
    {
      type: "list",
      name: "customization",
      message: "What customization do you want to apply?",
      choices: customizationRepos.map((customizationRepo) => customizationRepo.name).sort(),
    },
  ]);

  //Return the full customizationRepo info
  return customizationRepos.find((customizationRepo) => customizationRepo.name == answer.customization);
}

/* ************************************************************************ */
async function downloadCustomizationFiles(customizationRepo) {
  const { xdgData } = await import("xdg-basedir");
  const baseDir = process.cwd();
  const cacheDir = path.resolve(xdgData,"cob-cli")
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

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
  process.chdir(baseDir);
}

/* ************************************************************************ */
async function applyCustomization(customizationRepo, args) {
  console.log("\nApplying " + customizationRepo.name + " customization ...");

  // Get customization info from convention defined file (customize.js)
  if (!args.local) await downloadCustomizationFiles(customizationRepo);
  
  const { xdgData } = await import("xdg-basedir");
  const customizationPath = path.resolve( xdgData, "cob-cli", customizationRepo.name);
  const customizationFile = path.resolve( customizationPath, "customize.js");
  if (!fs.existsSync(customizationFile))
    throw new Error("\nError: ".red + " no customize.js file found\n");

  let customization = (await import(customizationFile)).default;

  // Asks questions, if configuration exists
  let answers = {};
  if (customization.questions) {
    answers = await inquirer.prompt(customization.questions);
  }

  // Apply specific customization, if it exists, otherwise use default actions
  if (customization.actions) {
    customization.actions(customizationRepo.name, answers, copyAndMerge);
  } else {
    // Default actions
    await copyAndMerge(customizationRepo.name, answers);
  }

  // Update customizations.json file
  updateCustomizationsVersions(customizationRepo.name, customization.version);
}

/* ************************************************************************ */
async function copyAndMerge(customizationRepoName, substitutions = {}) {
  // https://www.npmtrends.com/copyfiles-vs-cpx-vs-ncp-vs-npm-build-tools
  // https://www.npmjs.com/package/ncp
  // https://www.npmjs.com/package/copyfiles

  let source 
  if(customizationRepoName.indexOf("/") == 0) {
    // Based of customizationRepoName starting with "/" we assume this is already a fullpath
    source = customizationRepoName;
  } else {
    // Otherwise assume customizationRepoName on standard cob-cli xdgData path
    const { xdgData } = await import("xdg-basedir");
    source = path.resolve( xdgData, "cob-cli", customizationRepoName);
  }

  console.log("  Copying template files ...");

  let excludedFiles = RegExp(
    "(" +
    source + "/\\.git.*" +
    "|" +
    source + "/README.*" +
    "|" +
    source + "/customize.js" +
    "|" +
    source + ".*/node_modules/" +
    ")"
  );

  // Source is on cob-cli customizationRepo and Destination on the server repo
  const target = process.cwd() // Always copy to directory where command is being executed, ie, the root directory of the server repo
  const substitutionRegex = /__(((?!word).)*)__/g;
  return new Promise((resolve, reject) => {  
    ncp(
      source,
      target,
      {
        clobber: true,
        filter: (src) => src.match(excludedFiles) == null,
        rename: function(target) {
          // Don't rename __MERGE__ templates, they will be handled by the merge method
          if (target.match(/__MERGE__/)) return target;
          
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
      async (error) => {
        // If no error occurred then proced with merging files
        if(!error) {
          await mergeFiles(customizationRepoName);
          resolve();
        } else {
          reject(error.map((e) => e.message).join("\n"))
        }
      }
    )
  });
}

/* ************************************************************************ */
async function mergeFiles(block) {
  const mergeFiles = await fg(["**/*.__MERGE__.*"], {
    onlyFiles: false,
    dot: true,
  });
  for (let mergeFile of mergeFiles) {
    let prodFile = mergeFile.replace(/\.__MERGE__/, "");
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
    let startStr = "/* COB-CLI START " + blockMark + " */\n";
    let endStr = "\n/* COB-CLI END " + blockMark + " */\n";

    if (prodFileContent.indexOf(startStr) < 0) {
      // If previous customization does not exist
      prodFileContent = startStr + mergeFileContent + endStr + prodFileContent;
    } else {
      // If previous customization exists
      let beforeMerge = prodFileContent.indexOf(startStr);
      let afterMerge = prodFileContent.indexOf(endStr) + endStr.length;
      prodFileContent =
        prodFileContent.substring(0, beforeMerge) +
        startStr +
        mergeFileContent +
        endStr +
        prodFileContent.substring(afterMerge);
    }
    fs.writeFileSync(prodFile, prodFileContent);

    fs.unlinkSync(mergeFile);
  }
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