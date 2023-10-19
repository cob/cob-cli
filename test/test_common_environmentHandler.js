const t = require('tap');
const fs = require('fs');
const fg = require('fast-glob');
const git = require('simple-git');
const debug = require('debug');
const { getCurrentCommandEnviroment } = require("../lib/task_lists/common_enviromentHandler");

let startingCwd;
let cwd;

t.beforeEach(async () => {
    startingCwd = process.cwd();

    cwd = "tmp-test-" + Math.floor(100000 + Math.random() * 900000)

    fs.mkdirSync(cwd);
    process.chdir(cwd);

    fs.mkdirSync("environments/qual", {recursive: true});
    fs.writeFileSync("environments/qual/server", "qual.test.com");

    // debug.enable('simple-git,simple-git:*')
    await git().init();
})

t.afterEach((t) => {
    process.chdir(startingCwd);
    if(t.passing()) fs.rmdirSync(cwd, {recursive: true});
})

t.test("smoke", async t => {
    fs.writeFileSync('simple.txt', 'simple');

    const env = await getCurrentCommandEnviroment({}, 'server.test.com');
    env.applyCurrentCommandEnvironmentChanges();

    t.match(await listFiles(), ['simple.txt'])
})

t.test("there's an ENV file, but no default", async t => {
    fs.writeFileSync('file.ENV__prod__.txt', 'ENV__prod__');
    await git().add('*').commit('initial');

    const env = await getCurrentCommandEnviroment({}, 'server.test.com');
    await env.applyCurrentCommandEnvironmentChanges();

    t.match(await listFiles(), ['file.ENV__DELETE__.txt', 'file.txt'])
    t.ok(fs.readFileSync('.git/info/exclude').includes('file.txt'))
    t.match(await assumedIgnored(), ['file.ENV__prod__.txt'] )

    await env.unApplyCurrentCommandEnvironmentChanges();
    t.match(await listFiles(), ['file.ENV__prod__.txt'])
    t.ok(!fs.existsSync('.git/info/exclude'))
}) 


t.test("there's an ENV and a default", async t => {
    fs.writeFileSync('file.txt', 'existing');
    fs.writeFileSync('file.ENV__prod__.txt', 'ENV__prod__');
    await git().add('*').commit('initial');

    const env = await getCurrentCommandEnviroment({}, 'server.test.com');
    await env.applyCurrentCommandEnvironmentChanges();

    t.match(await listFiles(), ['file.ENV__ORIGINAL_BACKUP__.txt', 'file.txt'])
    t.match(await assumedIgnored(), ['file.ENV__prod__.txt', 'file.txt'] )

    await env.unApplyCurrentCommandEnvironmentChanges();
    t.match(await listFiles(), ['file.ENV__prod__.txt', 'file.txt'])
    t.ok((await assumedIgnored()).length == 0)
}) 

t.test("there's multiple ENVs but no default", async t => {
    fs.writeFileSync('file.ENV__prod__.txt', 'ENV__prod__');
    fs.writeFileSync('file.ENV__qual__.txt', 'ENV__qual__');
    await git().add('*').commit('initial');

    const env = await getCurrentCommandEnviroment({environment: 'qual'}, 'server.test.com');
    await env.applyCurrentCommandEnvironmentChanges();

    t.match(await listFiles(), ['file.ENV__DELETE__.txt', 'file.ENV__prod__.txt', 'file.txt'])
    t.match(await assumedIgnored(), ['file.ENV__qual__.txt'] )

    await env.unApplyCurrentCommandEnvironmentChanges();
    t.match(await listFiles(), ['file.ENV__prod__.txt', 'file.ENV__qual__.txt'])
    t.ok((await assumedIgnored()).length == 0)
}) 

t.test("there's multiple ENVs and a default", async t => {
    fs.writeFileSync('file.txt', 'existing');
    fs.writeFileSync('file.ENV__prod__.txt', 'ENV__prod__');
    fs.writeFileSync('file.ENV__qual__.txt', 'ENV__qual__');
    await git().add('*').commit('initial');

    const env = await getCurrentCommandEnviroment({environment: 'qual'}, 'server.test.com');
    await env.applyCurrentCommandEnvironmentChanges();

    t.match(await listFiles(), ['file.ENV__ORIGINAL_BACKUP__.txt', 'file.ENV__prod__.txt', 'file.txt'])
    t.match(await assumedIgnored(), ['file.ENV__qual__.txt', 'file.txt'] )

    await env.unApplyCurrentCommandEnvironmentChanges();
    t.match(await listFiles(), ['file.ENV__prod__.txt', 'file.ENV__qual__.txt', 'file.txt'])
    t.ok((await assumedIgnored()).length == 0)
}) 


const listFiles = async () => {
    return (await fg(['*'], {})).sort()
}

const assumedIgnored = async () => {
    return (await git().raw(['ls-files','-v']) )
        .split('\n')
        .filter(f => f.startsWith('h '))
        .map(f => f.substring(2))
        .sort()
}

