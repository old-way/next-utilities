"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_constant_1 = require("../constants/actions.constant");
const execute_node_script_function_1 = require("./execute-node-script.function");
const get_browser_env_function_1 = require("./get-browser-env.function");
const start_browser_process_function_1 = require("./start-browser-process.function");
function openBrowser(url) {
    const { action, value } = get_browser_env_function_1.getBrowserEnv();
    switch (action) {
        case actions_constant_1.Actions.NONE:
            return false;
        case actions_constant_1.Actions.SCRIPT:
            return execute_node_script_function_1.executeNodeScript(value, url);
        case actions_constant_1.Actions.BROWSER:
            return start_browser_process_function_1.startBrowserProcess(value, url);
        default:
            throw new Error('Not implemented.');
    }
}
exports.openBrowser = openBrowser;
