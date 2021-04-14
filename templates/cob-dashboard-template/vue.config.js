let DASH_DIR = process.env.dash_dir
let SERVER = process.env.server

if(!process.env.dash_dir || !SERVER) {
  // Provavelmente corrido via 'npm run serve' e não tenha variáveis de ambiente definidas
  console.log("LOCAL 'npm run serve' ON OWN DIRECTORY ASSUMPTION")  
  
  let pwd = process.env.PWD
  DASH_DIR = pwd.substring(pwd.lastIndexOf("/")+1)
  
  let localSubPosition = pwd.indexOf("/recordm/customUI")
  let serverFile = (localSubPosition > 0 ? pwd.substring(0,localSubPosition) :  ".") + "/.server"
  try {
    // Se estivermos dentro de um repo cob-cli então vamos conseguir obter o servidor a partir do '.server' na raiz do repo
    SERVER = "https://" + require('fs').readFileSync(serverFile, 'utf8') + ".cultofbits.com";
  } catch {
    //  se não conseguirmos usamos a máquina de formação como default
    SERVER = "https://learning.cultofbits.com";
    console.warn("Warning: file '.server' not found. Using " + SERVER + " as backend" )
  }
}

module.exports = {
  // temos que fixar o directorio onde colocamos o build,
  //  para podermos usar o dashboard.html que é gerado sem o editar
  // NOTA: o path relativo não funciona bem com o npm run serve
  // mas queremos que o build seja relativo, para ser mais fléxivel
  publicPath: process.env.NODE_ENV === 'production'
    ? './localresource/' + DASH_DIR + '/dist/'
    : '/' + DASH_DIR,

  // seguindo https://cli.vuejs.org/guide/webpack.html
  chainWebpack: config => {
    // para não termos chunks
    config.optimization.delete('splitChunks');
    
    // fazemos assim em vez de usar o pages, que confunde o publicPath
    config
      .plugin('html')
      .tap(args => {
        args[0].template = 'src/dashboard.html'  // Isto permite ler o ficheiro daqui em vez do default public/index.html
        args[0].filename = 'dashboard.html'      // Isto indica que o nome no url será dashboard.html em vez de index.html
        args[0].inject = false                   // Não queremos inject automático pois o nosso src/dashboard.html sabe lidar com página isolado ou integrado no recordm. TODO: considerar permitir ainda shared vue e vuetify em vez de embebido (o actual). Ver NOTA abaixo.
        args[0].minify = true
        args[0].rmIntegrated = process.env.dash_dir || process.env.NODE_ENV === 'production'  // Esta é a variável utilizada dentro do src/dashboard.html para saber qual o render a utilizar (isolado ou integrado). Deve ser integrado quer quando corrido via cob-cli test -d <dashboard> quer quando é feito o build.
        return args
      })
  },
    
  // NOTA: Código comentado porque abandonamos a opção de usar ficheiros partilhados. Se quisermos reverter isto é necessário:
  // configureWebpack: {
  //   // deve ser igual ao que é usado no afterDeps do public/dashboard.html
  //   // Se for LOCAL temos de usar os locais
  //   externals: LOCAL ? {} : {
  //     vue: 'Vue',
  //     vuetify: 'Vuetify',
  //     axios: 'axios',
  //     marked: 'marked'
  //   },
  // },

  devServer: {
    port: 8041,
    before: function(app) {
      app.get('/*', function(req, res, next) {
        // Permite usar / ou /DASH_BOARD/ quando acedido directamente
        if(req.url != "/" && req.url != '/'+DASH_DIR+'/') {
          return next();
        }

        res.redirect(`/${DASH_DIR}/dashboard.html`);
      });
    },
    proxy: {
      [ "/recordm/localresource/" + DASH_DIR + "/dist"]: {
        // Isto serve o propósito de rescrever os pedidos feitos via url final para o url local.
        // Tem o defeito de apenas funcionar quando o devserver está a funcionar no 8041. 
        // Ou seja, não suporta mais que um vue-cli-service a funcionar ao mesmo tempo (apenas 1 estará a funcionar correctamente)
        // TODO: idealmente seria feito sem ser via proxy (talvez via url-loader rewrite ??)
        target: "http://localhost:8041",
        pathRewrite: path => path.replace("/recordm/localresource/" + DASH_DIR + "/dist","/" + DASH_DIR ),
        bypass: function(req, res, proxyOptions) {
          if(req.path.indexOf(DASH_DIR) > 0) {
            console.log("[CoB] Serving DASHBOARD:  " + req.path)
          }
        }
      },
      "^/userm|^/recordm|^/es|^/logm|^/kibana": {
        target: SERVER,
        ws: true,
        changeOrigin: true,
        bypass: function(req, res, proxyOptions) {
          console.log("[CoB] Serving " + SERVER + ":  " + req.path)
        }
      },
      "/get_user_lang|/security|/localresource|/recordm|/user|/reportm|/cas": {
        target: SERVER,
        ws: true,
        changeOrigin: true,
        pathRewrite: path => path.replace("/recordm/recordm", "/recordm")
      }
    }
  }
}