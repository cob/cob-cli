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
async function customize(customizationArg, otherArgs) {
  try {
    console.log("Customize...");
    checkVersion();
    if (!otherArgs.force) await checkWorkingCopyCleanliness();

    let repo = await getCustomizationRepo(customizationArg);
    await getCustomizationFiles(repo);
    await applyCustomization(repo);

    console.log( colors.green("\nDone"), "\nCheck changes to your git working tree and try:" );
    console.log( "\tcob-cli test\n" );
  } catch (err) {
    console.error("\n", err.message);
  }
}
module.exports = customize;
/* ************************************************************************ */

async function getCustomizationRepo(arg) {
  // Get list of relevant customizations
  let customizationNameQuery = "customize. " + (arg ? arg : "");
  let response = await axios.get(
    "https://api.github.com/search/repositories?q=" +
      customizationNameQuery + "+in:name+org:cob",
    { headers: { Accept: "application/json", "Accept-Encoding": "identity" } }
  );

  if (response.data.items.length == 0)
    throw new Error("\nError: ".red + " no customization found\n");

  // Asks for customization to apply
  const customizationRepos = response.data.items;
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

async function getCustomizationFiles(repo) {
  console.log("git clone or update" + repo.ssh_url);

  const { xdgData } = await import("xdg-basedir");
  const baseDir = process.cwd();
  if (!fs.existsSync(xdgData)) fs.mkdirSync(xdgData, { recursive: true });
  process.chdir(xdgData);
  try {
    await git().clone(repo.ssh_url);
  } catch (e) {
    if (e.message.indexOf("already exists") > 0) {
      process.chdir(repo.name);
      try {
        await git().pull();
      } catch {}
    }
  }
  process.chdir(baseDir);
}

async function applyCustomization(repo) {
  console.log("\nApplying " + repo.name + " customization ...");

  // Get customization info from convention defined file (customization.js)
  const { xdgData } = await import("xdg-basedir");
  const customizationFile = path.resolve(
    xdgData,
    repo.name,
    "customization.js"
  );
  if (!fs.existsSync(customizationFile))
    throw new Error("\nError: ".red + " no customization.js file found\n");

  let customization = (await import(customizationFile)).default;

  // Asks options, if configuration exists
  let options = {};
  if (customization.questions) {
    options = await inquirer.prompt(customization.questions);
  }

  // Apply specific customization, if it exists, otherwise use default actions
  if (customization.actions) {
    customization.actions(repo.name, options, copy, mergeFiles);
  } else {
    // Default actions
    await copy(path.resolve(xdgData, repo.name), "./");
    await mergeFiles(repo.name);
  }

  // Update customizations.json file
  updateCustomizationsVersions(repo.name, customization.version);
}

function copy(source, target, substitutions = {}) {
  // https://www.npmtrends.com/copyfiles-vs-cpx-vs-ncp-vs-npm-build-tools
  // https://www.npmjs.com/package/ncp
  // https://www.npmjs.com/package/copyfiles

  console.log("  Copying template files to '" + target + "'...");

  let srcPath = path.resolve(process.cwd(), source);
  // let excludedFiles = RegExp(srcPath + ".*/node_modules/");
  let excludedFiles = RegExp(
    "(" +
      srcPath +
      ".*/node_modules/|" +
      srcPath +
      "/\\..*|" +
      srcPath +
      "/customization.js)"
  );

  return new Promise(async (resolve) => {
    // Source is on cob-cli repo and Destination on the server repo
    await ncp(
      path.resolve(process.cwd(), source),
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
      (error, x) => {
        if (error) {
          // Error is an array of problems
          resolve(error.map((e) => e.message).join("\n"));
        } else {
          resolve();
        }
      }
    );

    const files = await fg(["**/*.__*__.*"], { onlyFiles: true, dot: true });
    files.forEach((file) => {
      if (file.match(/__MERGE__/)) return;
      fs.renameSync(
        file,
        file.replace(/__.+__/g, (m) => substitutions[m])
      );
    });
  });
}

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
    let startStr = "/* COB-CLI START Customization " + blockMark + " */\n";
    let endStr = "\n/* COB-CLI END Customization " + blockMark + " */\n";

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

function updateCustomizationsVersions(customizationKey, version) {
  const customizationsVersionsFile = "customizations.json";
  let customizationsVersions;
  try {
    let customizationsVersionsRawData = fs.readFileSync(
      customizationsVersionsFile
    );
    customizationsVersions = JSON.parse(customizationsVersionsRawData);
  } catch (err) {
    customizationsVersions = {};
  }
  customizationsVersions[customizationKey] = version;

  fs.writeFile(
    customizationsVersionsFile,
    JSON.stringify(customizationsVersions, null, 2),
    (err) => {
      if (err)
        console.log(
          "Error writing " + customizationsVersionsFile + ":",
          err.message
        );
    }
  );
}