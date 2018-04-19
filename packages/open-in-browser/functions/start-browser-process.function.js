"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const osx_chrome_constant_1 = require("../constants/osx-chrome.constant");
const opn = require("opn");
function startBrowserProcess(browser, url) {
    const shouldTryOpenChromeWithAppleScript = process.platform === "darwin" &&
        (typeof browser !== "string" || browser === osx_chrome_constant_1.OSX_CHROME);
    if (shouldTryOpenChromeWithAppleScript) {
        try {
            child_process_1.execSync("ps cax | grep \"Google Chrome\"");
            child_process_1.execSync("osascript openChrome.applescript \"" + encodeURI(url) + "\"", {
                cwd: __dirname,
                stdio: "ignore",
            });
            return true;
        }
        catch (err) {
        }
    }
    if (process.platform === "darwin" && browser === "open") {
        browser = undefined;
    }
    try {
        const options = { app: browser };
        opn(url, options);
        return true;
    }
    catch (err) {
        return false;
    }
}
exports.startBrowserProcess = startBrowserProcess;

//# sourceMappingURL=start-browser-process.function.js.map
