const execa = require('execa');
const path = require('path');

function customUIsContinuosReload(server) {
    let webpack = execa(path.resolve(__dirname, '../../node_modules/.bin/webpack-dev-server'), [
        "--config",
        path.resolve(__dirname, "../webpack/webpack.config.js"),
        "--env.SERVER=" + "https://" + server
    ]);
    webpack.stdout.pipe(process.stdout);
    return webpack;
}
exports.customUIsContinuosReload = customUIsContinuosReload;