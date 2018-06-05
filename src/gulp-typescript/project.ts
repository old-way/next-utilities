import * as path from "path";
import * as PluginError from "plugin-error";
import * as stream from "stream";
import * as ts from "typescript";
import * as VinylFile from "vinyl";
import * as vfs from "vinyl-fs";
import { Compiler, FileCompiler, ProjectCompiler } from "./compiler";
import { FileCache } from "./input";
import { Output } from "./output";
import { defaultReporter, Reporter } from "./reporter";
import { TsConfig } from "./types";
import * as utils from "./utils";

interface PartialProject {
    (reporter?: Reporter): CompileStream;

    src?(this: Project): NodeJS.ReadWriteStream;

    typescript?: typeof ts;

    projectDirectory?: string;

    configFileName?: string;

    rawConfig?: any;

    config?: TsConfig;

    options?: ts.CompilerOptions;
}

export interface Project {
    (reporter?: Reporter): CompileStream;

    src(this: Project): NodeJS.ReadWriteStream;

    readonly typescript?: typeof ts;

    readonly projectDirectory: string;

    readonly configFileName: string;

    readonly rawConfig: any;

    readonly config: TsConfig;

    readonly options: ts.CompilerOptions;
}

export interface ProjectInfo {
    input: FileCache;

    output: Output;

    compiler: Compiler;

    singleOutput: boolean;

    options: ts.CompilerOptions;

    typescript: typeof ts;

    directory: string;

    reporter: Reporter;
}

export function setupProject(
    projectDirectory: string,
    configFileName: string,
    rawConfig: any,
    config: TsConfig,
    options: ts.CompilerOptions,
    typescript: typeof ts,
) {
    const input = new FileCache(typescript, options);
    const compiler: Compiler = options.isolatedModules ? new FileCompiler() : new ProjectCompiler();
    let running = false;

    if (options.isolatedModules) {
        options.newLine = typescript.NewLineKind.LineFeed;
        options.sourceMap = false;
        options.declaration = false;
        options.inlineSourceMap = true;
    }

    const project: PartialProject = (reporter) => {
        if (running) {
            throw new Error("gulp-typescript: A project cannot be used in two compilations at the same time. Create multiple projects with createProject instead.");
        }
        running = true;

        input.reset();
        compiler.prepare(projectInfo);

        const stream = new CompileStream(projectInfo);
        projectInfo.output = new Output(projectInfo, stream, stream.js, stream.dts);
        projectInfo.reporter = reporter || defaultReporter();

        stream.on("finish", () => {
            running = false;
        });

        return stream;
    };

    const singleOutput = options.out !== undefined || options.outFile !== undefined;

    project.src = src;
    project.typescript = typescript;
    project.projectDirectory = projectDirectory;
    project.configFileName = configFileName;
    project.rawConfig = rawConfig;
    project.config = config;
    project.options = options;

    const projectInfo: ProjectInfo = {
        input,
        singleOutput,
        compiler,
        options,
        typescript,
        directory: projectDirectory,
        // Set when `project` is called
        output: undefined,
        reporter: undefined,
    };

    return project as Project;
}

function src(this: Project) {
    if (arguments.length >= 1) {
        utils.message("tsProject.src() takes no arguments", "Use gulp.src(..) if you need to specify a glob");
    }

    let base: string;
    if (this.options.rootDir) {
        base = path.resolve(this.projectDirectory, this.options.rootDir);
    }

    const { extends: _extends, ...config } = this.rawConfig;

    const { fileNames, errors } = this.typescript.parseJsonConfigFileContent(
        config,
        this.typescript.sys,
        path.resolve(this.projectDirectory),
        undefined,
        path.basename(this.configFileName),
    );

    for (const error of errors) {
        console.log(error.messageText);
    }

    if (base === undefined) {
        base = utils.getCommonBasePathOfArray(
            fileNames.filter(file => file.substr(-5) !== ".d.ts")
                .map(file => path.dirname(file)));
    }

    const vinylOptions = { base, allowEmpty: true };
    return vfs.src(fileNames, vinylOptions);
}

export interface CompileStream extends NodeJS.ReadWriteStream {
    js: stream.Readable;

    dts: stream.Readable;
}

class CompileStream extends stream.Duplex implements CompileStream {
    constructor(project: ProjectInfo) {
        super({ objectMode: true });

        this.project = project;

        // Prevent "Unhandled stream error in pipe" when a compilation error occurs.
        this.on("error", () => {
        });
    }

    private project: ProjectInfo;

    _write(file: any, encoding: string, cb: (err?: any) => void): void;
    _write(file: VinylFile, encoding: string, cb = (err?: any) => {
    }) {
        if (!file) {
            return cb();
        }

        if (file.isNull()) {
            cb();
            return;
        }
        if (file.isStream()) {
            return cb(new PluginError("gulp-typescript", "Streaming not supported"));
        }

        const inputFile = this.project.input.addGulp(file);

        this.project.compiler.inputFile(inputFile);

        cb();
    }

    _read() {
    }

    end(chunk?: any, encoding?: any, callback?: any) {
        if (typeof chunk === "function") {
            this._write(undefined, undefined, chunk);
        } else if (typeof encoding === "function") {
            this._write(chunk, undefined, encoding);
        } else {
            this._write(chunk, encoding, callback);
        }
        this.project.compiler.inputDone();
    }

    js: stream.Readable = new CompileOutputStream();

    dts: stream.Readable = new CompileOutputStream();
}

class CompileOutputStream extends stream.Readable {
    constructor() {
        super({ objectMode: true });
    }

    _read() {
    }
}
