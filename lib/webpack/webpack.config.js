const path = require('path');
const fs = require('fs')
const SERVER = "https://mimes8.cultofbits.com";

module.exports = {
  watch: true,
  entry: {
    fake_customizations2: path.resolve(__dirname,'./fake_customizations2.js')
  },
  devServer: {
    contentBase: '.',
    watchContentBase: true,
    watchOptions: {
      ignored: [
        /^integrationm/,
        /^logm/,
        /^recordm-importer/,
        /\/elasticsearch\//,
        /\/hornet\//,
        /\/reports\//,
        /\/security\//,
        /\/services\//
      ]
    },
    liveReload: true,
    port: 8040,
    stats: {
      maxModules: 0 // Set the maximum number of modules to be shown
    },
    proxy: {
      "/": {
        logLevel: "warn",
        target: SERVER,
        ws: false,
        changeOrigin: true,
        bypass: function(req, res, proxyOptions) {
          // console.log("Testing " + req.path)
          let localPath
          if(req.path == "/recordm/localresource/js/customizations2.js")      return "/fake_customizations2.js";
          if(req.path == "/recordm/localresource/js/customizations2.real.js") return "/recordm/customUI/js/customizations2.js"
          if(req.path.indexOf("/localresource/") > 0) {
            localPath = req.path.substring(1).replace("/localresource/","/customUI/")
            console.log("[CoB] Serving LOCAL -> " + localPath);
          }
          return localPath;          
        }
      }
    }
  }
};