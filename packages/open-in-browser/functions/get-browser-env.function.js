"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_constant_1 = require("../constants/actions.constant");
function getBrowserEnv() {
    let value = process.env.BROWSER;
    let action;
    if (!value) {
        action = actions_constant_1.actions.BROWSER;
        value = "";
    }
    else if (value.toLowerCase().endsWith(".js")) {
        action = actions_constant_1.actions.SCRIPT;
    }
    else if (value.toLowerCase() === "none") {
        action = actions_constant_1.actions.NONE;
    }
    else {
        action = actions_constant_1.actions.BROWSER;
    }
    return { action, value };
}
exports.getBrowserEnv = getBrowserEnv;

//# sourceMappingURL=get-browser-env.function.js.map
