/* Ponto de entrada do webpack. */
/* Necessário para o livereload. */
console.log("[CoB] Starting live-reload")

var scriptTag = document.createElement('script');
scriptTag.src = "/recordm/localresource/js/customizations2.real.js";
document.body.appendChild(scriptTag);
