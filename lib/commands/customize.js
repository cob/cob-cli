const inquirer = require('inquirer');
const colors = require("colors");
const path = require("path");
const { checkVersion } = require("./upgradeRepo");
const { checkWorkingCopyCleanliness } = require("../task_lists/common_helpers");
const axios = require("axios");
const git = require("simple-git/promise");
const ncp = require("ncp");
const { Transform } = require("stream");
const fg = require("fast-glob");
const fs = require("fs-extra");

/* ************************************************************************ */
async function customize(filter, args) {
  try {
    console.log("Customize...");
    checkVersion();
    if (!args.force) await checkWorkingCopyCleanliness();

    let repo = await getCustomizationRepo(filter,args);
    if (!args.local) await getCustomizationFiles(repo);
    await applyCustomization(repo);

    console.log( colors.green("\nDone"), "\nCheck changes to your git working tree and try:" );
    console.log( "\tcob-cli test\n" );
  } catch (err) {
    console.error("\n", err.message);
  }
}
module.exports = customize;

/* ************************************************************************ */
async function getCustomizationRepo(filter, args) {
  const { xdgData } = await import("xdg-basedir");
  const cacheCustomizations = path.resolve(xdgData,"cob-cli","customizations.json")
  
  let customizationRepos;
  let customizationNameQuery = "customize. " + (filter ? filter : "");
  if (args.local) {
    customizationRepos = JSON.parse(fs.readFileSync(cacheCustomizations))
    if (filter) {
      customizationRepos = customizationRepos.filter(repo => repo.name.indexOf(filter) != -1)
    }
  } else {    
    // Get list of relevant customizations from github
    let response = await axios.get(
      "https://api.github.com/search/repositories?q=" +
        customizationNameQuery + "+in:name+org:cob",
      { headers: { Accept: "application/json", "Accept-Encoding": "identity" } }
    )
    customizationRepos = response.data.items
  }

  // Check if there's at least one customization
  if (customizationRepos.length == 0) throw new Error("\nError: ".red + " no customization found\n");

  // Asks for customization to apply
  if (args.cache && args.local) {
    throw new Error("\nError: ".red + " incompatible options, --local AND --cache\n");
  } else if(args.cache) {
    console.log("Caching all customizations...");
    for( let repo of customizationRepos) {
      await getCustomizationFiles(repo);
    }
    fs.writeFileSync( cacheCustomizations,
      JSON.stringify(customizationRepos, null, 2),
      (err) => {
        if (err) console.log( "Error writing " + cacheCustomizations + ":", err.message);
      }
    )
  }

  let answer = await inquirer.prompt([
    {
      type: "list",
      name: "customization",
      message: "What customization do you want to apply?",
      choices: customizationRepos.map((repo) => repo.name).sort(),
    },
  ]);

  //Return the full repo info
  return customizationRepos.find((repo) => repo.name == answer.customization);
}

/* ************************************************************************ */
async function getCustomizationFiles(repo) {
  const { xdgData } = await import("xdg-basedir");
  const baseDir = process.cwd();
  const cacheDir = path.resolve(xdgData,"cob-cli")
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  process.chdir(cacheDir);
  if (!fs.existsSync(path.resolve(cacheDir,repo.name))) {
    console.log("  git  " + repo.ssh_url);
    await git().clone(repo.ssh_url);
  } else {
    console.log("  git pull " + repo.ssh_url);
    process.chdir(repo.name);
    await git().pull();
  }
  process.chdir(baseDir);
}

/* ************************************************************************ */
async function applyCustomization(repo) {
  console.log("\nApplying " + repo.name + " customization ...");

  // Get customization info from convention defined file (customize.js)
  const { xdgData } = await import("xdg-basedir");
  const customizationPath = path.resolve( xdgData, "cob-cli", repo.name);
  const customizationFile = path.resolve( customizationPath, "customize.js");
  if (!fs.existsSync(customizationFile))
    throw new Error("\nError: ".red + " no customize.js file found\n");

  let customization = (await import(customizationFile)).default;

  // Asks options, if configuration exists
  let answers = {};
  if (customization.questions) {
    answers = await inquirer.prompt(customization.questions);
  }

  // Apply specific customization, if it exists, otherwise use default actions
  if (customization.actions) {
    customization.actions(repo.name, options, copy, mergeFiles);
  } else {
    // Default actions
    await copy(customizationPath, process.cwd(), answers);
    await mergeFiles(repo.name);
  }

  // Update customizations.json file
  updateCustomizationsVersions(repo.name, customization.version);
}

/* ************************************************************************ */
async function copy(source, target, substitutions = {}) {
  // https://www.npmtrends.com/copyfiles-vs-cpx-vs-ncp-vs-npm-build-tools
  // https://www.npmjs.com/package/ncp
  // https://www.npmjs.com/package/copyfiles

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

  // Source is on cob-cli repo and Destination on the server repo
  await ncp(
    source,
    target,
    {
      clobber: true,
      filter: (src) => src.match(excludedFiles) == null,
      // TODO: comentado porque não funciona a copiar os ficheiros binários (em concreto as font no template/dashboards/dash)
      // transform(read, write) {
      //     const replaceVars = new Transform({
      //         transform: (chunk, encoding, done) => done(null,chunk.toString().replace(/__.+__/g, m => substitutions[m]))
      //     })
      //     read.pipe(replaceVars).pipe(write)
      // }
    },
    (error) => error && error.map((e) => e.message).join("\n")
  );

  const dryrun = await fg(["**/*__*__*"], { onlyFiles: false, dot: true }); //Just to give time for OS to stabilize
  const files = await fg(["**/*__*__*"], { onlyFiles: false, dot: true });
  for(let file of files.filter(name => name.indexOf("node_modules") == -1))  {
    if (file.match(/__MERGE__/)) return;
    fs.renameSync( file, file.replace(/__(.+)__/g, (match,g1) => substitutions[g1]) );
  }
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
  const customizationsVersionsFile = "customizations.json";
  let customizationsVersions;
  try {
    const customizationsVersionsRawData = fs.readFileSync(customizationsVersionsFile);
    customizationsVersions = JSON.parse(customizationsVersionsRawData);
  } catch (err) {
    customizationsVersions = {};
  }
  customizationsVersions[customizationKey] = version;

  fs.writeFileSync(
    customizationsVersionsFile,
    JSON.stringify(customizationsVersions, null, 2),
    (err) => {
      if (err) console.log( "Error writing " + customizationsVersionsFile + ":", err.message );
    }
  );
}