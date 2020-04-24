const colors = require('colors');

function test () {
    console.log('Test...');
    console.log(colors.green("\nDone"), "\nIf everything is ok you can now run:");
    console.log("\tcob-cli deploy\n")
};
module.exports = test;
