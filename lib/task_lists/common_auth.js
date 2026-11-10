const axios = require('axios');
const tough = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support')
const path = require('path')
const FileCookieStore = require('file-cookie-store');
const { promptCredentials } = require("./common_helpers.js");

/* ************************************ */
// Prepares the global axios instance to talk to the HTTPs API of cmdEnv's server.
// Authentication is done either with the cobtoken found on the cookie file given by --cookie
// or, if not given, with the credentials asked to the user (same as updateFromServer and tagDefs).
async function authenticate(cmdEnv, args) {
    axiosCookieJarSupport.wrapper(axios)
    axios.defaults.ignoreCookieErrors = true
    axios.defaults.withCredentials = true
    const cookieJar = new tough.CookieJar()
    axios.defaults.jar = cookieJar

    if (args.cookie) {
        const p = path.resolve(args.cookie);
        const cookieFile = new FileCookieStore(p, {auto_sync: false, force_parse: true});
        const cookie = await new Promise((resolve, reject) => {
            cookieFile.findCookie(cmdEnv.serverHTTPs, '/', 'cobtoken', (err, result) => {
                if (err != null) reject(err);
                else resolve(result)
            })
        });
        if (!cookie) {
            throw new Error(`couldn't find a cookie for ${cmdEnv.servername} in ${p}`)
        }
        await cookieJar.setCookie(cookie.toString(), `https://${cmdEnv.serverHTTPs}`)

    } else {
        const credentials = await promptCredentials()
        try {
            await axios.post(`https://${cmdEnv.serverHTTPs}/recordm/security/auth`, credentials, {
                headers: {
                    "Content-Type": "application/json",
                },
            })
        } catch (err) {
            if (err.response) throw new Error(`Authentication on ${cmdEnv.serverHTTPs} failed: HTTP ${err.response.status} ${err.response.statusText}`)
            throw err
        }
    }
}

/* ************************************ */
module.exports = {
    authenticate: authenticate
};
