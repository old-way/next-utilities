import * as path from "path";
import * as ts from "typescript";
import * as _project from "./project";
import * as _reporter from "./reporter";
import { TsConfig } from "./types";
import * as utils from "./utils";

function compile(proj: _project.Project, theReporter?: _reporter.Reporter): compile.CompileStream;
function compile(settings: compile.Settings, theReporter?: _reporter.Reporter): compile.CompileStream;
function compile(): compile.CompileStream;
function compile(param?: any, theReporter?: _reporter.Reporter): compile.CompileStream {
    if (arguments.length >= 3) {
        utils.deprecate("Reporter are now passed as the second argument",
            "remove the second argument",
            "Filters have been removed as of gulp-typescript 3.0.\nThe reporter is now passed as the second argument instead of the third argument.");
    }

    let proj: _project.Project;
    if (typeof param === "function") {
        proj = param;
        if (arguments.length >= 2) {
            utils.deprecate("ts(tsProject, ...) has been deprecated",
                "use .pipe(tsProject(reporter)) instead",
                "As of gulp-typescript 3.0, .pipe(ts(tsProject, ...)) should be written as .pipe(tsProject(reporter)).");
        } else {
            utils.deprecate("ts(tsProject) has been deprecated",
                "use .pipe(tsProject()) instead",
                "As of gulp-typescript 3.0, .pipe(ts(tsProject)) should be written as .pipe(tsProject()).");
        }
    } else {
        proj = compile.createProject(param || {});
    }
    return proj(theReporter);
}

function getTypeScript(typescript: typeof ts) {
    if (typescript) {
        return typescript;
    }
    try {
        return require("typescript");
    } catch (e) {
        utils.deprecate("TypeScript not installed",
            "install with `npm install typescript --save-dev`",
            "As of gulp-typescript 3.0, TypeScript isn't bundled with gulp-typescript any more.\nInstall the latest stable version with `npm install typescript --save-dev`\nor a nightly with `npm install typescript@next --save-dev`");
        throw new Error("TypeScript not installed");
    }
}

function checkAndNormalizeSettings(settings: compile.Settings): compile.Settings {
    const { declarationFiles, noExternalResolve, sortOutput, typescript, ...standardSettings } = settings;

    if (settings.sourceRoot !== undefined) {
        console.warn("gulp-typescript: sourceRoot isn't supported any more. Use sourceRoot option of gulp-sourcemaps instead.");
    }

    if (noExternalResolve !== undefined) {
        utils.deprecate("noExternalResolve is deprecated",
            "use noResolve instead",
            "The non-standard option noExternalResolve has been removed as of gulp-typescript 3.0.\nUse noResolve instead.");
    }
    if (sortOutput !== undefined) {
        utils.deprecate("sortOutput is deprecated",
            "your project might work without it",
            "The non-standard option sortOutput has been removed as of gulp-typescript 3.0.\nYour project will probably compile without this option.\nOtherwise, if you're using gulp-concat, you should remove gulp-concat and use the outFile option instead.");
    }

    if (declarationFiles) {
        standardSettings.declaration = settings.declarationFiles;
    }

    return standardSettings;
}

function normalizeCompilerOptions(options: ts.CompilerOptions): void {
    options.sourceMap = true;
    (options as any).suppressOutputPathCheck = true;
    options.inlineSourceMap = false;
    options.sourceRoot = undefined;
    options.inlineSources = false;
}

function reportErrors(errors: Array<ts.Diagnostic>, typescript: typeof ts, ignore: Array<number> = []): void {
    const reporter = _reporter.defaultReporter();
    for (const error of errors) {
        if (ignore.indexOf(error.code) !== -1) {
            continue;
        }

        reporter.error(utils.getError(error, typescript), typescript);
    }
}

namespace compile {
    export interface Settings {
        out?: string;

        outFile?: string;

        outDir?: string;

        allowNonTsExtensions?: boolean;

        charset?: string;

        codepage?: number;

        declaration?: boolean; // alias of declarationFiles
        locale?: string;

        mapRoot?: string;

        noEmitOnError?: boolean;

        noImplicitAny?: boolean;

        noLib?: boolean;

        noLibCheck?: boolean;

        noResolve?: boolean;

        preserveConstEnums?: boolean;

        removeComments?: boolean;

        suppressImplicitAnyIndexErrors?: boolean;

        target?: string | ts.ScriptTarget;

        module?: string | ts.ModuleKind;

        moduleResolution?: string | number;

        jsx?: string | number;

        declarationFiles?: boolean;

        noExternalResolve?: boolean;

        sortOutput?: boolean;

        typescript?: typeof ts;

        isolatedModules?: boolean;

        rootDir?: string;

        rootDirs?: any;

        lib?: Array<string>;

        experimentalDecorators?: boolean;

        [name: string]: any;

        // Unsupported by gulp-typescript
        sourceRoot?: string; // Use sourceRoot in gulp-sourcemaps instead
    }

    export type Project = _project.Project;
    export type CompileStream = _project.ICompileStream;
    export import reporter = _reporter;

    export function createProject(tsConfigFileName: string, settings?: Settings): Project;
    export function createProject(settings?: Settings): Project;
    export function createProject(fileNameOrSettings?: string | Settings, settings?: Settings): Project {
        let tsConfigFileName: string;
        let tsConfigContent: TsConfig;
        let projectDirectory = process.cwd();
        let typescript: typeof ts;
        let compilerOptions: ts.CompilerOptions;
        let fileName: string;

        let rawConfig: any;

        if (fileNameOrSettings !== undefined) {
            if (typeof fileNameOrSettings === "string") {
                fileName = fileNameOrSettings;
                tsConfigFileName = path.resolve(process.cwd(), fileName);
                projectDirectory = path.dirname(tsConfigFileName);
                if (settings === undefined) {
                    settings = {};
                }
            } else {
                settings = fileNameOrSettings || {};
            }

            typescript = getTypeScript(settings.typescript);
            settings = checkAndNormalizeSettings(settings);

            const settingsResult = typescript.convertCompilerOptionsFromJson(settings, projectDirectory);

            if (settingsResult.errors) {
                reportErrors(settingsResult.errors, typescript);
            }

            compilerOptions = settingsResult.options;

            if (fileName !== undefined) {
                const tsConfig = typescript.readConfigFile(tsConfigFileName, typescript.sys.readFile);
                if (tsConfig.error) {
                    console.log(tsConfig.error.messageText);
                }

                const parsed: ts.ParsedCommandLine =
                    typescript.parseJsonConfigFileContent(
                        tsConfig.config || {},
                        getTsconfigSystem(typescript),
                        path.resolve(projectDirectory),
                        compilerOptions,
                        path.basename(tsConfigFileName));

                rawConfig = parsed.raw;

                tsConfigContent = parsed.raw;

                if (parsed.errors) {
                    reportErrors(parsed.errors, typescript, [18003]);
                }

                compilerOptions = parsed.options;
            }
        }

        normalizeCompilerOptions(compilerOptions);
        const project = _project.setupProject(projectDirectory, tsConfigFileName, rawConfig, tsConfigContent, compilerOptions, typescript);

        return project;
    }

    export function filter(...args: Array<any>) {
        utils.deprecate("ts.filter() is deprecated",
            "soon you can use tsProject.resolve()",
            "Filters have been removed as of gulp-typescript 3.0.\nSoon tsProject.resolve() will be available as an alternative.\nSee https://github.com/ivogabe/gulp-typescript/issues/190.");
    }
}

function getTsconfigSystem(typescript: typeof ts): ts.ParseConfigHost {
    return {
        useCaseSensitiveFileNames: typescript.sys.useCaseSensitiveFileNames,
        readDirectory: () => [],
        fileExists: typescript.sys.fileExists,
        readFile: typescript.sys.readFile,
    };
}

export = compile;
