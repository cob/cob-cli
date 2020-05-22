const execa = require('execa');
const path = require('path');

function customUIsContinuosReload(server) {
    let webpack = execa(path.resolve(__dirname, '../../node_modules/.bin/webpack-dev-server'), [
        "--config",
        "../cob-cli/lib/webpack/webpack.config.js",
        "--env.SERVER=" + server
    ]);
    webpack.stdout.pipe(process.stdout);
    return webpack;
}
exports.customUIsContinuosReload = customUIsContinuosReload;