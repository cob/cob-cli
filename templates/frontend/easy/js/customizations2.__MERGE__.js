cob.custom.customize.push(function(core, utils, ui){
    function loadComponents() {
        cob.custom.loaded = true;

        utils.loadCSS("localresource/css/_easy/vuetify.cob-scoped.css");
        utils.loadCSS("localresource/css/_easy/googlefonts.css");

        utils.loadScript("localresource/js/_easy/lib/axios.min.js", function () { });
        utils.loadScript("localresource/js/_easy/lib/marked.min.js", function () {} );
        utils.loadScript("localresource/js/_easy/lib/vue.js", function () {
                        // tem que ser carregado depois de já haver Vue
            utils.loadScript("localresource/js/_easy/lib/vuetify.min.js", function () {});
        });
    }

    if(core.getGroups() && core.getGroups().length > 0){
        if(!cob.custom.loaded) loadComponents();
    } else core.subscribe("updated-app-info", function () {
        if(core.getGroups() && !cob.custom.loaded) loadComponents();
    });

});