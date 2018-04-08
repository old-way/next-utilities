import { Actions } from "../constants/actions.constant";

export function getBrowserEnv() {
    // Attempt to honor this environment variable.
    // It is specific to the operating system.
    // See https://github.com/sindresorhus/opn#app for documentation.
    let value = process.env.BROWSER;
    let action;
    if (!value) {
        // Default.
        action = Actions.BROWSER;
        value = "";
    } else if (value.toLowerCase().endsWith('.js')) {
        action = Actions.SCRIPT;
    } else if (value.toLowerCase() === 'none') {
        action = Actions.NONE;
    } else {
        action = Actions.BROWSER;
    }
    return { action, value };
}
