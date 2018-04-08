"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_constant_1 = require("../constants/actions.constant");
function getBrowserEnv() {
    let value = process.env.BROWSER;
    let action;
    if (!value) {
        action = actions_constant_1.Actions.BROWSER;
        value = "";
    }
    else if (value.toLowerCase().endsWith('.js')) {
        action = actions_constant_1.Actions.SCRIPT;
    }
    else if (value.toLowerCase() === 'none') {
        action = actions_constant_1.Actions.NONE;
    }
    else {
        action = actions_constant_1.Actions.BROWSER;
    }
    return { action, value };
}
exports.getBrowserEnv = getBrowserEnv;
