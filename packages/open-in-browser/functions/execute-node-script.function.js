"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spawn = require("cross-spawn");
const chalk_1 = require("chalk");
function executeNodeScript(scriptPath, url) {
    const extraArgs = process.argv.slice(2);
    const child = spawn("node", [scriptPath, ...extraArgs, url], {
        stdio: "inherit",
    });
    child.on("close", code => {
        if (code !== 0) {
            console.log();
            console.log(chalk_1.default.red("The script specified as BROWSER environment variable failed."));
            console.log(chalk_1.default.cyan(scriptPath) + " exited with code " + code + ".");
            console.log();
            return;
        }
    });
    return true;
}
exports.executeNodeScript = executeNodeScript;

//# sourceMappingURL=execute-node-script.function.js.map
