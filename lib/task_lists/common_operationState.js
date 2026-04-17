const fs = require('fs-extra');
const STATE_FILE = ".git/cob-cli-state";

function saveOperationState(environment, servername) {
    try { fs.writeJsonSync(STATE_FILE, { environment, servername }); } catch {}
}

function loadOperationState() {
    try { return fs.readJsonSync(STATE_FILE); } catch { return null; }
}

function clearOperationState() {
    try { fs.unlinkSync(STATE_FILE); } catch {}
}

module.exports = { saveOperationState, loadOperationState, clearOperationState };
