const colors = require('colors');
const execa = require('execa');
const Listr = require('listr');

module.exports = function(server) {
    console.log("Initiating", colors.red(colors.bold(server)) , "configurations:" );

    const tasks = new Listr([
        {
            title: 'Git',
            task: () => {
                return new Listr([
                    {
                        title: 'Checking git status',
                        task: () => execa('git', ['status', '--porcelain']).then(result => {
                            if (result !== '') {
                                throw new Error('Unclean working tree. Commit or stash changes first.');
                            }
                        })
                    },
                    {
                        title: 'Checking remote history',
                        task: () => execa('git', ['rev-list', '--count', '--left-only', '@{u}...HEAD']).then(result => {
                            if (result !== '0') {
                                throw new Error('Remote history differ. Please pull changes.');
                            }
                        })
                    }
                ]);
            }
        },
        {
            title: 'Install package dependencies with Yarn',
            task: (ctx, task) => execa('yarn')
                .catch(() => {
                    ctx.yarn = false;
     
                    task.skip('Yarn not available, install it via `npm install -g yarn`');
                })
        },
        {
            title: 'Install package dependencies with npm',
            enabled: ctx => ctx.yarn === false,
            task: () => execa('npm', ['install'])
        },
        {
            title: 'Run tests',
            task: () => execa('npm', ['test'])
        },
        {
            title: 'Publish package',
            task: () => execa('npm', ['publish'])
        }
    ]);
     
    tasks.run().catch(err => {
        console.error("\nAbort:",err.message);
    });

}