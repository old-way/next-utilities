import { actions } from "../constants/actions.constant";

export function getBrowserEnv() {
    // Attempt to honor this environment variable.
    // It is specific to the operating system.
    // See https://github.com/sindresorhus/opn#app for documentation.
    let value = process.env.BROWSER;
    let action;
    if (!value) {
        // Default.
        action = actions.BROWSER;
        value = "";
    } else if (value.toLowerCase().endsWith(".js")) {
        action = actions.SCRIPT;
    } else if (value.toLowerCase() === "none") {
        action = actions.NONE;
    } else {
        action = actions.BROWSER;
    }
    return { action, value };
}
