import { existsSync } from "fs";
import { join } from "path";

export class BackendPlugin {
    protected path = join(
        process.cwd(),
        "storages",
        "caches",
        "server.js",
    );

    public apply(compiler) {
        compiler.plugin("done", () => {
            if (existsSync(this.path)) {
                require(this.path);
            }
        });
    }
}
