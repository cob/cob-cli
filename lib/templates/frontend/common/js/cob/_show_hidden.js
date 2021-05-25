// Mostrar botão para mostrar campos hidden se /recordm/?dev=true# ou System
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances(function (instance, presenter) {
        const urlParams = new URLSearchParams(window.location.search);
        const dev = urlParams.get('dev') || (core.getGroups() || []).includes("System");
        document.documentElement.style.setProperty("--dev-display", "");

        if ( (dev == true || dev == "true")  
            && (   $(".custom-hide").size() 
                || $("custom-hide-in-edit").size() 
                || $(".custom-hide-in-group-edit").size() 
                || $(".custom-hide-in-new-instance").size() 
               )
            ){

            if(!document.getElementById("checkHidden")) {
                var node = document.createElement('div');        
                node.innerHTML = '<input type="checkbox" id="checkHidden" name="checkHidden" style="display: inline-block;margin-bottom: 4px;margin-left: -4px;">'
                               + '<label for="checkHidden" style="display: inline-block;">Show Hidden</label>';
                        
                var sidenav = document.getElementsByClassName("js-expand-all")[0];
                sidenav.after(node);
                
                let show = false;
                node.addEventListener ("input", function() {
                    if(show = !show) {
                        document.documentElement.style.setProperty("--dev-display", "block");
                    } else {
                        document.documentElement.style.setProperty("--dev-display", "");
                    }
                });
            }
        }
    });
});
