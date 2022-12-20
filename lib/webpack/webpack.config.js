const path = require('path');

module.exports = env => {
  return {
    entry: {
      fake_customizations2: path.resolve(__dirname,'./fake_customizations2.js')
    },
    devServer: {
      static : {
        directory: '.',
        watch: {
          ignored: [
            "**/.git/**",
            "**/integrationm/**",
            "**/recordm-importer/**",
            "**/node_modules/**",
            "**/node_modules/.cache/**",
            "**/services/**",
            "**/" + process.env.dash_dir + "/**"
          ]
        }  
      },
      hot:false,
      port: 8040,
      host: "0.0.0.0",
      setupMiddlewares: (middlewares, devServer) => {
        middlewares.unshift({
          name: 'redirect-localhost:8080/-to-localhost:8080/record/',
          middleware: (req, res, next) => {
            // Permite usar / ou /DASH_BOARD/ quando acedido directamente
            if(req.url != "/")  return next();
            res.redirect(`/recordm/`);
          },
        });
        return middlewares;
      },
      proxy: {
        [ "**/" + process.env.dash_dir + "/**"]: {
          target: "http://localhost:8041",
          secure: false
        },
        [ "/docs/**"]: {
          target: "http://localhost:8080",
          secure: false
        },
        "/": {
          logLevel: "warn",
          target: process.env.server,
          secure: false,
          ws: false,
          changeOrigin: true,
          bypass: function(req, res, proxyOptions) {
            // console.log("Testing " + req.path)
            let localPath
            if(req.path == "/recordm/localresource/js/customizations2.js")      return "/fake_customizations2.js";
            if(req.path == "/recordm/localresource/js/customizations2.real.js") return "/recordm/customUI/js/customizations2.js"
            if(req.path.indexOf("/localresource/") > 0) {
              localPath = req.path.substring(1).replace("/localresource/","/customUI/")
              console.log("[CoB] Serving LOCAL -> " + localPath );
            }
            return localPath;          
          },
          onProxyRes: response => {
            response.headers['content-security-policy'] = "default-src 'unsafe-inline' 'unsafe-eval' https: data: http: ws:";
          }
        }
      }
    }
  }
};
