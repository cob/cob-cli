const axios = require('axios').default
const fs = require('fs');
const CONF = require('./config.json')


async function getSidebar(lang) {
    const rootElementsResponse = await axios.post('https://' + CONF.server + '/integrationm/action/getVuePressSidebarRootElements',{})
    const rootElements = rootElementsResponse.data
    let sidebar = {}
    let langPrefix = (lang == "en") ? "" : "/" + lang
    for(rootElement of rootElements) {
        sidebar[langPrefix + rootElement] = (await axios.post('https://' + CONF.server + '/integrationm/action/getVuePressSidebarConfig',{path:rootElement,lang:lang})).data;
    }
    return sidebar
}

async function getAllPages() {
    const content = await axios.post('https://' + CONF.server + '/integrationm/action/getVuePressDoc',{})
    return content.data;
}

async function createFilesFromServerInfo() {
    fs.mkdirSync("./debug/.vuepress", { recursive: true }, (err) => {
        if (err) throw err;
    });

    fs.writeFile('./debug/.vuepress/sidebarEN.json', JSON.stringify(await getSidebar("en")), () => {})
    fs.writeFile('./debug/.vuepress/sidebarPT.json', JSON.stringify(await getSidebar("pt")), () => {})
    fs.writeFile('./debug/.vuepress/sidebarES.json', JSON.stringify(await getSidebar("es")), () => {})
    
    const pages = await getAllPages()
    pages.forEach(page => {
        fs.mkdirSync("./debug" + page.path, { recursive: true }, (err) => {
            if (err) throw err;
        });
        fs.writeFile("./debug" + page.path + '/README.md', page.content, (err) => {
            if (err) throw err;
        });
    });
}

module.exports = async function() {
    const DEBUG = false;
    if(DEBUG) await createFilesFromServerInfo();

    return {
        base: "/docs/",
        dest: "nginx/dist",
        additionalPages: await getAllPages(),
        locales: {
            '/':    { lang: 'en-US', title:CONF.title },
            '/pt/': { lang: 'pt-PT', title:CONF.titlePT  },
            '/es/': { lang: 'es-ES', title:CONF.titleES  }
        },
        themeConfig: {
            displayAllHeaders: false,
            editLinks: true,
            locales: {
                '/': {
                    lang: 'en-US',
                    selectText: '🇬🇧',
                    label: 'English',
                    selectLanguageName: 'English',
                    nav: CONF.nav,
                    sidebar: await getSidebar("en")
                },
                '/pt/': {
                    lang: 'pt-PT',
                    selectText: '🇵🇹',
                    label: 'Português',
                    selectLanguageName: 'Português',
                    nav: CONF.navPT,
                    sidebar: await getSidebar("pt")
                },
                '/es/': {
                    lang: 'es-ES',
                    selectText: '🇪🇸',
                    label: 'Espanol',
                    selectLanguageName: 'Español',
                    nav: CONF.navES,
                    sidebar: await getSidebar("es")
                }
            },
            logo: '/logo.png'
        },
        head: [
            ['link', { href: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700;900&display=swap', rel: 'stylesheet' } ],
            ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
            ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
            ['meta', { name: 'theme-color', content: '#d5184b' }],
            ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
            ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
        ],
        plugins: [
            require('./plugins/References.js'),
            'vuepress-plugin-reading-time',
            '@vuepress/back-to-top',
            '@vuepress/medium-zoom'
        ]
    }
}