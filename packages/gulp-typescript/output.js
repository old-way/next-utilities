"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const sourceMap = require("source-map");
const VinylFile = require("vinyl");
const utils = require("./utils");
class Output {
    constructor(_project, streamFull, streamJs, streamDts) {
        this.project = _project;
        this.streamFull = streamFull;
        this.streamJs = streamJs;
        this.streamDts = streamDts;
    }
    writeJs(base, fileName, content, sourceMapContent, cwd, original) {
        const file = new VinylFile({
            path: fileName,
            contents: new Buffer(content),
            cwd,
            base,
        });
        const appliedSourceMap = this.applySourceMap(sourceMapContent, original, file);
        if (appliedSourceMap) {
            file.sourceMap = JSON.parse(appliedSourceMap);
        }
        this.streamFull.push(file);
        this.streamJs.push(file);
    }
    writeDts(base, fileName, content, cwd) {
        const file = new VinylFile({
            path: fileName,
            contents: new Buffer(content),
            cwd,
            base,
        });
        this.streamFull.push(file);
        this.streamDts.push(file);
    }
    applySourceMap(sourceMapContent, original, output) {
        if (sourceMapContent === undefined) {
            return undefined;
        }
        const map = JSON.parse(sourceMapContent);
        const directory = path.dirname(output.path);
        map.file = utils.forwardSlashes(output.relative);
        map.sources = map.sources.map(relativeToOutput);
        delete map.sourceRoot;
        const generator = sourceMap.SourceMapGenerator.fromSourceMap(new sourceMap.SourceMapConsumer(map));
        const sourceMapOrigins = this.project.singleOutput
            ? this.project.input.getFileNames(true).map(fName => this.project.input.getFile(fName))
            : [original];
        for (const sourceFile of sourceMapOrigins) {
            if (!sourceFile || !sourceFile.gulp || !sourceFile.gulp.sourceMap) {
                continue;
            }
            const inputOriginalMap = sourceFile.gulp.sourceMap;
            const inputMap = typeof inputOriginalMap === "object" ? inputOriginalMap : JSON.parse(inputOriginalMap);
            if (inputMap.mappings !== "") {
                const consumer = new sourceMap.SourceMapConsumer(inputMap);
                generator.applySourceMap(consumer);
            }
            if (!inputMap.sources || !inputMap.sourcesContent) {
                continue;
            }
            for (let i = 0; i < inputMap.sources.length; i++) {
                const absolute = path.resolve(sourceFile.gulp.base, inputMap.sources[i]);
                const relative = path.relative(output.base, absolute);
                generator.setSourceContent(utils.forwardSlashes(relative), inputMap.sourcesContent[i]);
            }
        }
        return generator.toString();
        function relativeToOutput(fileName) {
            const absolute = path.resolve(directory, fileName);
            return utils.forwardSlashes(path.relative(output.base, absolute));
        }
    }
    finish(result) {
        this.result = result;
        if (this.project.reporter.finish) {
            this.project.reporter.finish(result);
        }
        this.streamFull.emit("finish");
        this.streamFull.push(null);
        this.streamJs.push(null);
        this.streamDts.push(null);
    }
    getError(info) {
        const fileName = info.file && info.file.fileName;
        const file = fileName && this.project.input.getFile(fileName);
        return utils.getError(info, this.project.typescript, file);
    }
    diagnostic(info) {
        this.error(this.getError(info));
    }
    error(error) {
        if (!error) {
            return;
        }
        if (this.project.reporter.error) {
            this.project.reporter.error(error, this.project.typescript);
        }
        this.streamFull.emit("error", error);
    }
}
exports.Output = Output;

//# sourceMappingURL=output.js.map
