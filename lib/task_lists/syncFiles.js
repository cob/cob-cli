const Listr = require('listr');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');
/* ************************************ */
function syncFiles(server, from, to, testEqualityOnly) {
    /* **************** */
    function _resolvePath(server, type, product) {
        if (type == "localMaster") {
            return path.resolve(".") + "/" + product + "/";
        }
        if (type == "productionMaster") {
            return server + ":/opt/cob-cli.production.checkout/" + product + "/";
        }
        if (type == "productionDefault") {
            return server + ":/opt/" + product + "/etc.default/";
        }
        if (type == "productionLive") {
            return server + ":"
                + ((product == "recordm-importer")
                    ? "/opt/recordm-importer/"
                    : "/etc/" + product + "/");
        }
    }
    /* **************** */
    let tasks = [];
    let products = ["recordm", "integrationm", "recordm-importer", "logm", "userm", "devicem"];
    products.forEach(function (product) {
        let fromPath = _resolvePath(server, from, product);
        let toPath = _resolvePath(server, to, product);
        tasks.push({
            title: (testEqualityOnly ? "Test " : "Sync ") + product + " " + from + (testEqualityOnly ? " == " : " to ") + to,
            task: (ctx, task) => execa('rsync', [
                fromPath,
                toPath,
                "-aczv",
                "--delete",
                "--exclude=db",
                "--exclude=node_modules",
                "--exclude=build",
                "--exclude=uploaded",
                "--exclude=.processed",
                "--exclude=.failed",
                "--exclude=recordm-importer.log*",
                "--exclude=recordm-importer*.jar",
                "--exclude=.git",
                "--exclude=.DS_Store",
                testEqualityOnly ? "--dry-run" : "-v"
            ])
                .then((value) => {
                    let result = value.stdout
                        .split("\n")
                        .slice(1, -3) // Apenas as linhas com as diferenças é que interessam 
                        .filter(line => !line.endsWith("/")) // diferenças nos settings das directorias tb não interessam
                        .map(line => {
                            if (line.startsWith("deleting")) {
                                return line.replace("deleting", "removed");
                            }
                            else {
                                return "added/changed " + line;
                            }
                        });
                    if (testEqualityOnly && result != "") {
                        git().checkout(ctx.branch); // get back to original branch
                        let errors = [
                            "Compared to the production copy of '" + product + "/master', local checkout has:",
                            result.map(line => "\t " + line).join("\n"),
                            "\n Either some version(s) of master where not deployed or your copy of master is not updated",
                            " You have 2 options: either choose the server version or the local version. ",
                            // "\t (TODO: Give options like 'cob-cli redeploy' or 'cob-cli reset-project')",
                            "Error:".bgRed + " Deployed checkout is different from local/master checkout"
                        ];
                        throw new Error(errors.join("\n"));
                    }
                })
                .catch((err) => {
                    if (err.exitCode == 12 || err.exitCode == 23)
                        task.skip('Not present');
                    else
                        throw err;
                })
        });
    });
    return new Listr(tasks, { concurrent: true });
}

exports.syncFiles = syncFiles;
