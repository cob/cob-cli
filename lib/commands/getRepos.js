const colors = require("colors");
const path = require("path");
const axios = require("axios");
const git = require("simple-git");
const fs = require("fs-extra");

async function getRepos(token) {
    console.log("Clone/update all accessible repos ...");

    try {
        const response = await axios.get( "https://gitlab.com/api/v4/projects?membership=true\&private_token="+token+"\&per_page=100&&archived=false&search=server_", { headers: { Accept: "application/json", "Accept-Encoding": "identity" } } )
        serverRepos = response.data
        if (serverRepos.length == 0) throw new Error("\nError: ".red + " no server repo found\n");


        const baseDir = process.cwd();

        for (const serverRepo of serverRepos) {
            if (!fs.existsSync(path.resolve(".",serverRepo.name))) {
                console.log("  git clone " + serverRepo.ssh_url_to_repo);
                await git().clone(serverRepo.ssh_url_to_repo);

            } else {
                console.log("  git pull " + serverRepo.ssh_url_to_repo);
                process.chdir(serverRepo.name);
                try {
                await git().pull();
                } catch (error) {
                    console.warn("Warning: ",serverRepo.name," -> ",error)
                }
                process.chdir(baseDir);
            }
        }

        console.log( colors.green("\nDone"));
    } catch (err) {
        console.error("\n", err.message);
    }
}
module.exports = getRepos;
