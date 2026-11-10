const axios = require('axios');
const tough = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support')
const path = require('path')
const FileCookieStore = require('file-cookie-store');
const { promptCredentials } = require("./common_helpers.js");

const COOKIE_NOT_FOUND = "COOKIE_NOT_FOUND"

/* ************************************ */
// Logs `client` (an axios instance, or the global axios) in on the server at `baseURL`, e.g.
// "https://acme.cultofbits.com": from then on it sends the session cookie on its requests.
// Authentication is done either with the cobtoken found on the cookie file given by --cookie
// or, if not given, with the credentials asked to the user (same as updateFromServer and tagDefs).
//
// Being unable to log in throws. Unless `optional` is set: then not being able to ask for credentials
// (no terminal) or the user answering an empty username (to skip) returns false instead (true when logged in).
// `name` is how the server is called on error messages (default: its hostname).
async function login(client, baseURL, args, { optional = false, name } = {}) {
    const host = new URL(baseURL).hostname
    name = name || host

    axiosCookieJarSupport.wrapper(client)
    client.defaults.ignoreCookieErrors = true
    client.defaults.withCredentials = true
    const cookieJar = new tough.CookieJar()
    client.defaults.jar = cookieJar

    if (args.cookie) {
        const p = path.resolve(args.cookie);
        const cookieFile = new FileCookieStore(p, {auto_sync: false, force_parse: true});
        const cookie = await new Promise((resolve, reject) => {
            cookieFile.findCookie(host, '/', 'cobtoken', (err, result) => {
                if (err != null) reject(err);
                else resolve(result)
            })
        });
        if (!cookie) {
            throw Object.assign(new Error(`couldn't find a cookie for ${name} in ${p}`), { code: COOKIE_NOT_FOUND })
        }
        await cookieJar.setCookie(cookie.toString(), baseURL)

    } else {
        if (optional && !process.stdin.isTTY) return false

        const credentials = await promptCredentials()
        if (optional && !credentials.username) return false

        try {
            await client.post(`${baseURL}/recordm/security/auth`, credentials, {
                headers: {
                    "Content-Type": "application/json",
                },
            })
        } catch (err) {
            if (err.response) throw new Error(`Authentication on ${host} failed: HTTP ${err.response.status} ${err.response.statusText}`)
            throw err
        }
    }
    return true
}

/* ************************************ */
// Prepares the global axios instance to talk to the HTTPs API of cmdEnv's server.
async function authenticate(cmdEnv, args) {
    await login(axios, `https://${cmdEnv.serverHTTPs}`, args, { name: cmdEnv.servername })
}

/* ************************************ */
// For servers other than cmdEnv's (e.g. the customizations inventory): returns a separate axios
// instance logged in on `baseURL`, leaving the global one untouched. With `optional`, returns null
// instead of throwing when there are no credentials to log in with (see login()).
async function createAuthenticatedClient(baseURL, args, { optional = false, timeout } = {}) {
    const client = axios.create({ timeout })
    return await login(client, baseURL, args, { optional }) ? client : null
}

/* ************************************ */
module.exports = {
    authenticate: authenticate,
    createAuthenticatedClient: createAuthenticatedClient,
    COOKIE_NOT_FOUND: COOKIE_NOT_FOUND
};
