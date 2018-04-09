import * as spawn from "cross-spawn";
import chalk from "chalk";

export function executeNodeScript(scriptPath: string, url: string) {
    const extraArgs = process.argv.slice(2);
    const child = spawn("node", [scriptPath, ...extraArgs, url], {
        stdio: "inherit",
    });
    child.on("close", code => {
        if (code !== 0) {
            console.log();
            console.log(
                chalk.red(
                    "The script specified as BROWSER environment variable failed."
                )
            );
            console.log(chalk.cyan(scriptPath) + " exited with code " + code + ".");
            console.log();
            return;
        }
    });
    return true;
}
