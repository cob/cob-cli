const colors = require('colors');
const { deployTasks } = require("../task_lists/deploy_tasks");
const fs = require('fs-extra');
const git = require('simple-git/promise');

/* ************************************************************************ */

async function deploy(server) {
    const projectName = "server_"+server;

    // check production.checkout == live conf (caso contrário alguém alterou o servidor fora do processo de gestão de alterações ==> resync)
    // garantir que git pull diz estamos actualizados (caso contrário indicar que é necessário fazer git pull)

    // garantir que estamos num branch (caso contrário avisar que o comando deve ser dado no branch a colocar em produção)
    
    // garantir que o branch on estamos tem todas as alterações commited (caso contrário indicar que não está limpo)
    // git checkout master
    // check production.checkout/revision == local.revision (caso contrário indicar que há versões no master que não foram deployed)

    if(  await masterUpdated() && await liveEqualsMaster() && await validBranchToDeploy(server)) {
        let tasks = deployTasks(server, args)
        tasks && tasks
            .run()
            .then( () => {
                console.log(colors.green("\nDone!"), "\nTry:");
                console.log("\tcd server_"+server)
                console.log("\tcob-cli customize\n")
            })
            .catch(err => {
                console.error("\n",err.message);
            })
    }  
}
module.exports = deploy;

/* *************************** PRE EXECUTION VALIDATIONS ********************************** */

async function notInsideGitRepo() {
    let isRepo = await git().checkIsRepo()
    if(!isRepo) return true
    console.log(colors.red("\nError:"),"current directory is part of a repository git.\n");
}

async function validCobServer(server) {
    var result; 
    try {
        result = await axios.get("https://"+server+".cultofbits.com/health")
    } catch {}
    
    if(result && result.status == "200") return true
    console.log(colors.red("\nError:"),colors.blue(colors.bold(server+".cultofbits.com")), "is not a valid CoB server.\n");
}

async function noLegacyOption(legacy) {
    if(!legacy) return true
    console.log(colors.red("\nError:"),"'--legacy' is an invalid option for an already existing repositories\n" );
}

/* ******************************** DECISION TESTS **************************************** */