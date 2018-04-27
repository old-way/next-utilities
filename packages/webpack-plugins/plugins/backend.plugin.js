"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
class BackendPlugin {
    constructor() {
        this.path = path_1.join(process.cwd(), "storages", "caches", "server.js");
    }
    apply(compiler) {
        compiler.plugin("done", () => {
            if (fs_1.existsSync(this.path)) {
                require(this.path);
            }
        });
    }
}
exports.BackendPlugin = BackendPlugin;

//# sourceMappingURL=backend.plugin.js.map
