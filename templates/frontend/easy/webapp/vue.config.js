const DASH_DIR = process.env.npm_package_config_dash_dir
const SERVER = process.env.npm_config_remote_server
   || ("https://" + process.env.npm_package_config_remote_server);

module.exports = {
  // temos que fixar o directorio onde colocamos o build,
 //  para podermos usar o dashboard.html que é gerado sem o editar
  // NOTA: o path relativo não funciona bem com o npm run serve
  // mas queremos que o build seja relativo, para ser mais fléxivel
  publicPath: process.env.NODE_ENV === 'production'
    ? './localresource/' + DASH_DIR + '/dist/'
    : '/' + DASH_DIR + '/',

  configureWebpack: {
    // deve ser igual ao que é usado no afterDeps do public/dashboard.html
    externals: {
      vue: 'Vue',
      vuetify: 'Vuetify',
      axios: 'axios',
      marked: 'marked'
    }
  },

  // seguindo https://cli.vuejs.org/guide/webpack.html
  chainWebpack: config => {
    // para não termos chunks
    config.optimization.delete('splitChunks');
    // fazemos assim em vez de usar o pages, que confunde o publicPath
    config
      .plugin('html')
      .tap(args => {
        args[0].template = 'public/dashboard.html'
        args[0].filename = 'dashboard.html'
        args[0].inject = false
        args[0].minify = false
        return args
      })
  },

  devServer: {
    proxy: {
      [`^/userm/localresource/${DASH_DIR}`]: {
        //logLevel: 'debug',
        target: "http://localhost:8080",
        pathRewrite: path =>
          path.replace(
            "/userm/localresource/" + DASH_DIR,
            "/" + DASH_DIR
          )
      },
      "^/userm|^/recordm|^/es|^/logm|^/kibana": {
        //logLevel: 'debug',
        target: SERVER,
        ws: true,
        changeOrigin: true
      },
      "/get_user_lang|/security|/localresource|/userm|/user|/reportm|/cas": {
        //logLevel: 'debug',
        target: SERVER,
        ws: true,
        changeOrigin: true,
        pathRewrite: path => path.replace("/userm/userm", "/userm")
      }
    }
  }
}
