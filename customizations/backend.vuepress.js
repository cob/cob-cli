exports.option = { 
    name: 'Vuepress - Recordm based CMS ', 
    short: "Dash",
    questions: [
    ],
    customization: async function (answers) {
        const { copy } = require("../lib/task_lists/customize_copy");
        await copy("../../templates/backend/vuepress/others/vuepress/","./others/vuepress/")
        await copy("../../templates/backend/vuepress/integrationm/actions/","./integrationm/actions/")
        //TODO: create/update definition
        //TODO: create/update permissions
        //TODO: criar instância .site. e .site.home.
        //TODO: perguntar id da definição de conteúdo e substituir onde necessário (actions e References.vue)
        //TODO: indicar que é necessário configurar o ./other/vuepress/
        //TODO: indicar que é necessário configurar o ./other/vuepress/
    }
}