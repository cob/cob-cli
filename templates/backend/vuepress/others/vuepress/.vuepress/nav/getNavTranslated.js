function langIndex(lang) {
    switch (lang) {
        case "en": return 0
        case "pt": return 1
        case "es": return 2
    }
}

const translations = {
    // 'Explanations': [,"Explicações","Explicaciones"],
    // "Tutorials":    [,"Tutoriais", "Tutoriales"],
    // "Howtos":       [,"Guias", "Guías"],
    // 'References':   [,"Referências","Referencias"],
    // "Showcases":    [,"Mostruário","Escaparate"],
    // "Examples":     [,"Exemplos", "Ejemplos"],
    // 'Updates':      [,"Actualizações","Actualizaciones"],
    'Users':      [,"Utilizadores","Usuários"],
    'Admins':     [,"Administradores","Administradores"],
    'Developers': [,"Programadores","Desarrolladores"],
    'Solutions':  [,"Soluções","Soluciones"],

    'Login':      [,"Login","Acceso"],
    'Backend':    [,"Back-end","Back-end"]
}

function translate(name,lang) {
    let i = langIndex(lang)
    if(i) {
        return translations[name][i]
    } else {
        return name
    }
}

module.exports = function getNavTranslated(lang) {
    let prefix = ["","/pt","/es"][langIndex(lang)] 
    return [
        { text: translate('Users',lang),      link: prefix + '/site/users/' },
        { text: translate('Admins',lang),     link: prefix + '/site/managers/' },
        { text: translate('Developers',lang), link: prefix + '/site/developers/' },
        { text: translate('Solutions',lang),  link: prefix + '/site/solutions/' },
        { text: translate('Login',lang),
          link: '/recordm/index.html#/cob.custom-resource/redirect/go-to-docs.html', 
          target: "_self",
          ifLoggedIn: false
        },
        { text: translate('Backend',lang),
          link: '/recordm/#/domain/2', 
          ifLoggedIn: true
        }
    ]
}