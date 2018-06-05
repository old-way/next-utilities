"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const host_1 = require("./host");
const input_1 = require("./input");
const reporter_1 = require("./reporter");
const utils = require("./utils");
class ProjectCompiler {
    prepare(project) {
        this.project = project;
        this.hasSourceMap = false;
    }
    inputFile(file) {
        if (file.gulp.sourceMap) {
            this.hasSourceMap = true;
        }
    }
    inputDone() {
        if (!this.project.input.firstSourceFile) {
            this.project.output.finish(reporter_1.emptyCompilationResult(this.project.options.noEmit));
            return;
        }
        const rootFilenames = this.project.input.getFileNames(true);
        if (!this.project.singleOutput) {
            if (this.project.options.rootDir === undefined) {
                this.project.options.rootDir = utils.getCommonBasePathOfArray(rootFilenames.filter(fileName => fileName.substr(-5) !== ".d.ts")
                    .map(fileName => this.project.input.getFile(fileName).gulp.base));
            }
        }
        this.project.options.sourceMap = this.hasSourceMap;
        const currentDirectory = utils.getCommonBasePathOfArray(rootFilenames.map(fileName => this.project.input.getFile(fileName).gulp.cwd));
        this.host = new host_1.Host(this.project.typescript, currentDirectory, this.project.input, this.project.options);
        this.program = this.project.typescript.createProgram(rootFilenames, this.project.options, this.host, this.program);
        const result = reporter_1.emptyCompilationResult(this.project.options.noEmit);
        result.optionsErrors = this.reportDiagnostics(this.program.getOptionsDiagnostics());
        result.syntaxErrors = this.reportDiagnostics(this.program.getSyntacticDiagnostics());
        result.globalErrors = this.reportDiagnostics(this.program.getGlobalDiagnostics());
        result.semanticErrors = this.reportDiagnostics(this.program.getSemanticDiagnostics());
        if (this.project.options.declaration) {
            result.declarationErrors = this.program.getDeclarationDiagnostics().length;
        }
        if (this.project.singleOutput) {
            const output = {
                file: undefined,
            };
            this.emit(result, (fileName, content) => {
                this.attachContentToFile(output, fileName, content);
            });
            this.emitFile(output, currentDirectory);
        }
        else {
            const output = {};
            const input = this.host.input.getFileNames(true);
            for (let i = 0; i < input.length; i++) {
                const fileName = utils.normalizePath(input[i]);
                const file = this.project.input.getFile(fileName);
                output[fileName] = { file };
            }
            this.emit(result, (fileName, content, writeByteOrderMark, onError, sourceFiles) => {
                if (sourceFiles.length !== 1) {
                    throw new Error("Failure: sourceFiles in WriteFileCallback should have length 1, got " + sourceFiles.length);
                }
                const fileNameOriginal = utils.normalizePath(sourceFiles[0].fileName);
                const file = output[fileNameOriginal];
                if (!file) {
                    return;
                }
                this.attachContentToFile(file, fileName, content);
            });
            for (let i = 0; i < input.length; i++) {
                const fileName = utils.normalizePath(input[i]);
                this.emitFile(output[fileName], currentDirectory);
            }
        }
        this.project.output.finish(result);
    }
    attachContentToFile(file, fileName, content) {
        const [, extension] = utils.splitExtension(fileName, ["d.ts"]);
        switch (extension) {
            case "js":
            case "jsx":
                file.jsFileName = fileName;
                file.jsContent = content;
                break;
            case "d.ts":
                file.dtsFileName = fileName;
                file.dtsContent = content;
                break;
            case "map":
                file.jsMapContent = content;
                break;
        }
    }
    emit(result, callback) {
        const emitOutput = this.program.emit(undefined, callback);
        result.emitErrors += emitOutput.diagnostics.length;
        this.reportDiagnostics(emitOutput.diagnostics);
        result.emitSkipped = emitOutput.emitSkipped;
    }
    emitFile({ file, jsFileName, dtsFileName, jsContent, dtsContent, jsMapContent }, currentDirectory) {
        if (!jsFileName) {
            return;
        }
        let base;
        let baseDeclarations;
        if (file) {
            base = file.gulp.base;
            if (this.project.options.outDir) {
                const baseRelative = path.relative(this.project.options.rootDir, base);
                base = path.join(this.project.options.outDir, baseRelative);
            }
            baseDeclarations = base;
            if (this.project.options.declarationDir) {
                const baseRelative = path.relative(this.project.options.rootDir, file.gulp.base);
                baseDeclarations = path.join(this.project.options.declarationDir, baseRelative);
            }
        }
        else if (this.project.options.outFile) {
            base = this.project.directory;
            baseDeclarations = base;
        }
        else {
            base = this.project.directory;
            baseDeclarations = base;
            jsFileName = path.resolve(base, jsFileName);
            if (dtsFileName !== undefined) {
                dtsFileName = path.resolve(base, dtsFileName);
            }
        }
        if (jsContent !== undefined) {
            if (jsMapContent !== undefined) {
                jsContent = this.removeSourceMapComment(jsContent);
            }
            this.project.output.writeJs(base, jsFileName, jsContent, jsMapContent, file ? file.gulp.cwd : currentDirectory, file);
        }
        if (dtsContent !== undefined) {
            this.project.output.writeDts(baseDeclarations, dtsFileName, dtsContent, file ? file.gulp.cwd : currentDirectory);
        }
    }
    reportDiagnostics(diagnostics) {
        for (const error of diagnostics) {
            this.project.output.diagnostic(error);
        }
        return diagnostics.length;
    }
    removeSourceMapComment(content) {
        const index = content.lastIndexOf("\n", content.length - 2);
        return content.substring(0, index) + "\n";
    }
}
exports.ProjectCompiler = ProjectCompiler;
class FileCompiler {
    constructor() {
        this.output = {};
        this.previousOutput = {};
        this.compilationResult = undefined;
    }
    prepare(project) {
        this.project = project;
        this.project.input.noParse = true;
        this.compilationResult = reporter_1.emptyCompilationResult(this.project.options.noEmit);
    }
    write(file, fileName, diagnostics, content, sourceMap) {
        this.output[file.fileNameNormalized] = { fileName, diagnostics, content, sourceMap };
        for (const error of diagnostics) {
            this.project.output.diagnostic(error);
        }
        this.compilationResult.transpileErrors += diagnostics.length;
        this.project.output.writeJs(file.gulp.base, fileName, content, sourceMap, file.gulp.cwd, file);
    }
    inputFile(file) {
        if (file.fileNameNormalized.substr(file.fileNameNormalized.length - 5) === ".d.ts") {
            return;
        }
        if (this.project.input.getFileChange(file.fileNameOriginal).state === input_1.FileChangeState.Equal) {
            const old = this.previousOutput[file.fileNameNormalized];
            this.write(file, old.fileName, old.diagnostics, old.content, old.sourceMap);
            return;
        }
        const diagnostics = [];
        const outputString = this.project.typescript.transpile(file.content, this.project.options, file.fileNameOriginal, diagnostics);
        const index = outputString.lastIndexOf("\n");
        let mapString = outputString.substring(index + 1);
        if (mapString.substring(0, 1) === "\r") {
            mapString = mapString.substring(1);
        }
        const start = "//# sourceMappingURL=data:application/json;base64,";
        if (mapString.substring(0, start.length) !== start) {
            console.log("Couldn't read the sourceMap generated by TypeScript. This is likely an issue with gulp-typescript.");
            return;
        }
        mapString = mapString.substring(start.length);
        const map = JSON.parse(new Buffer(mapString, "base64").toString());
        const [fileNameExtensionless] = utils.splitExtension(file.fileNameOriginal);
        const [, extension] = utils.splitExtension(map.file);
        this.write(file, fileNameExtensionless + "." + extension, diagnostics, outputString.substring(0, index), JSON.stringify(map));
    }
    inputDone() {
        this.project.output.finish(this.compilationResult);
        this.previousOutput = this.output;
        this.output = {};
    }
}
exports.FileCompiler = FileCompiler;

//# sourceMappingURL=compiler.js.map
