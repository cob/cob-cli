const fs = require('fs-extra');
const fg = require('fast-glob');
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

async function checkNoInterruptedRun() {
    const stateExists = !!loadOperationState();
    const envBackupFiles = await fg(['**/*.ENV__ORIGINAL_BACKUP__.*', '**/*.ENV__DELETE__.*'], { onlyFiles: false, dot: true });
    if (stateExists || envBackupFiles.length > 0) {
        throw new Error(
            "\nAborted:".red + " found traces of a previous interrupted test/deploy.\n"
            + "Run " + "cob-cli cleanup".yellow + " to restore the repo to a clean state first.\n"
        );
    }
}

module.exports = { saveOperationState, loadOperationState, clearOperationState, checkNoInterruptedRun };
