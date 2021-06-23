//--------------- Desativar "save button" da sidebar quando esta definição é aberta in-line ---------------------
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances(function(instance, presenter) {
        var mo = new MutationObserver(function (e) {
            //disables sidebar save button if more than 1 is present
            let saveButtons = document.getElementsByClassName("js-save-instance")
            if(saveButtons.length > 0) saveButtons[0].disabled = saveButtons.length > 1
        });
        mo.observe(document.querySelector('div.instance-container'), { childList: true, subtree: true });
    })
})