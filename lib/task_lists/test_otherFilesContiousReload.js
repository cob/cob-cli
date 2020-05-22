const fs = require('fs-extra');
function otherFilesContiousReload() {
    return fs.watch('.', { recursive: true }, (eventType, filename) => {
        if (filename && filename.indexOf("m/customUI") < 0) {
            process.stdout.write(`Sync ${filename} to production\n`);
            if (filename.indexOf("integrationm/scripts") < 0
                && filename.indexOf("integrationm/actions") < 0
                && filename.indexOf("integrationm/commons") < 0) {
                process.stdout.write(" Warning: this sync requires a restart".bgYellow.bold + "\n");
            }
        }
    });
}
exports.otherFilesContiousReload = otherFilesContiousReload;
