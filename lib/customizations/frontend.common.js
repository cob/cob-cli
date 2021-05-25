exports.option = {
  name: 'Common - Typical frontend customizations (https://learning.cultofbits.com)', 
  short: "Common",
  questions: [
  ],
  customization: async function (answers) {
      const { copy } = require("./common.copy");
      const target = "./recordm/customUI/"
      await copy("../templates/frontend/common/",target)
      merge(target)
  }
}

async function merge(target) {
  const fg = require('fast-glob');
  const fs = require('fs-extra');
  const mergeFiles = await fg(['**/*.__MERGE__.*'], { onlyFiles: false, dot: true });
  for( let mergeFile of mergeFiles ) {
    let prodFile = mergeFile.replace(/\.__MERGE__/,"")
    if(!fs.existsSync(prodFile)) {
      // If prod file does not exist creates it
      fs.closeSync(fs.openSync(prodFile, 'w'));
    }
    let prodFileContent = fs.readFileSync(prodFile).toString()
    let mergeFileContent = fs.readFileSync(mergeFile).toString()
    let startStr = '\n/* COB-CLI START ' + mergeFile + ' */ \n'
    let endStr   = '\n/* COB-CLI END ' + mergeFile + ' */ \n'

    if(prodFileContent.indexOf(startStr) < 0) {
      prodFileContent = startStr
                      + mergeFileContent 
                      + endStr
                      + prodFileContent;
    } else {
      let beforeMerge = prodFileContent.indexOf(startStr);
      let afterMerge  = prodFileContent.indexOf(endStr) + endStr.length;
      prodFileContent = prodFileContent.substring(0,beforeMerge)
                      + startStr
                      + mergeFileContent 
                      + endStr
                      + prodFileContent.substring(afterMerge);
    }
    fs.writeFileSync(prodFile, prodFileContent);
          
    fs.unlinkSync(mergeFile)    
  }
}