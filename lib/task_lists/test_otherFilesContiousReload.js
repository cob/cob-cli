const fs = require('fs-extra');

function otherFilesContiousReload(server, changedFiles) {
    return fs.watch('.', { recursive: true }, (eventType, filename) => {

        if (filename && filename.indexOf("m/customUI") < 0 && filename.indexOf(".git") < 0) {

            process.stdout.write(" Syncing ".bgRed.bold + " " + filename + "\n");
            changedFiles.add(filename)

            if (filename.indexOf("integrationm/scripts") < 0
                && filename.indexOf("integrationm/actions") < 0
                && filename.indexOf("integrationm/commons") < 0) {

                // process.stdout.write(" Warning: this sync requires a restart".yellow.bold + "\n");
                
            }
        }
    });
}
exports.otherFilesContiousReload = otherFilesContiousReload;
