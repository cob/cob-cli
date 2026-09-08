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
    const savedState = loadOperationState();
    const envBackupFiles = await fg(['**/*.ENV__ORIGINAL_BACKUP__.*', '**/*.ENV__DELETE__.*'], { onlyFiles: false, dot: true });
    if (savedState || envBackupFiles.length > 0) {
        const details = [];
        if (savedState) {
            details.push(
                "  saved state: environment " + (savedState.environment || "?").bold
                + ", server " + (savedState.servername || "?").bold
            );
        }
        if (envBackupFiles.length > 0) {
            details.push("  leftover environment backup files (" + envBackupFiles.length + "):");
            envBackupFiles.slice(0, 5).forEach(f => details.push("    " + f));
            if (envBackupFiles.length > 5) {
                details.push("    ... and " + (envBackupFiles.length - 5) + " more");
            }
        }

        throw new Error(
            "Aborted:".red + " found traces of a previous interrupted test/deploy.\n"
            + details.join("\n") + "\n\n"
            + "Run " + "cob-cli cleanup".yellow + " to restore the repo to a clean state first."
        );
    }
}

module.exports = { saveOperationState, loadOperationState, clearOperationState, checkNoInterruptedRun };
