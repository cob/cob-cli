/* Ponto de entrada do webpack. */
/* Necessário para o livereload. */
console.log("[CoB] Starting live-reload")

var scriptTag = document.createElement('script');
scriptTag.src = "/recordm/localresource/js/customizations2.real.js";
document.body.appendChild(scriptTag);

window.cob = window.cob || { custom : { customize : [], version: 1 } };

cob.custom.customize.push(function(core, utils, ui){
    cob.custom.customize.push = function() { Array.prototype.push.apply(this, arguments);  arguments[0](core, utils, ui); };
})