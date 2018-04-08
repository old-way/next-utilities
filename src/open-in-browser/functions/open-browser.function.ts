import { Actions } from "../constants/actions.constant";
import { executeNodeScript } from "./execute-node-script.function";
import { getBrowserEnv } from "./get-browser-env.function";
import { startBrowserProcess } from "./start-browser-process.function";

export function openBrowser(url) {
    const { action, value } = getBrowserEnv();
    switch (action) {
        case Actions.NONE:
            // Special case: BROWSER="none" will prevent opening completely.
            return false;
        case Actions.SCRIPT:
            return executeNodeScript(value, url);
        case Actions.BROWSER:
            return startBrowserProcess(value, url);
        default:
            throw new Error('Not implemented.');
    }
}
