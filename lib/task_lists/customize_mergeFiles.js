
async function mergeFiles(block) {
  const fg = require('fast-glob');
  const fs = require('fs-extra');
  const mergeFiles = await fg(['**/*.__MERGE__.*'], { onlyFiles: false, dot: true });
  for (let mergeFile of mergeFiles) {
    let prodFile = mergeFile.replace(/\.__MERGE__/, "");
    let blockMark = (block == undefined ? "" : block)
    if (!fs.existsSync(prodFile)) {
      // If prod file does not exist creates it
      console.log("  Creating " + prodFile)
      fs.closeSync(fs.openSync(prodFile, 'w'));
    } else {
      console.log("  Merging " + prodFile + " " + block)
    }
    let prodFileContent = fs.readFileSync(prodFile).toString();
    let mergeFileContent = fs.readFileSync(mergeFile).toString();
    let startStr = '/* COB-CLI START Customization ' + blockMark + ' */\n';
    let endStr = '\n/* COB-CLI END Customization ' + blockMark + ' */\n';

    if (prodFileContent.indexOf(startStr) < 0) {
      // If previous customization does not exist
      prodFileContent = startStr
        + mergeFileContent
        + endStr
        + prodFileContent;
    } else {
      // If previous customization exists
      let beforeMerge = prodFileContent.indexOf(startStr);
      let afterMerge = prodFileContent.indexOf(endStr) + endStr.length;
      prodFileContent = prodFileContent.substring(0, beforeMerge)
        + startStr
        + mergeFileContent
        + endStr
        + prodFileContent.substring(afterMerge);
    }
    fs.writeFileSync(prodFile, prodFileContent);

    fs.unlinkSync(mergeFile);
  }
}
exports.mergeFiles = mergeFiles;
