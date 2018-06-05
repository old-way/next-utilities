/// <reference types="node" />
import * as stream from "stream";
import * as ts from "typescript";
import * as input from "./input";
import * as project from "./project";
import * as reporter from "./reporter";
export declare class Output {
    constructor(_project: project.ProjectInfo, streamFull: stream.Readable, streamJs: stream.Readable, streamDts: stream.Readable);
    project: project.ProjectInfo;
    result: reporter.CompilationResult;
    streamFull: stream.Readable;
    streamJs: stream.Readable;
    streamDts: stream.Readable;
    writeJs(base: string, fileName: string, content: string, sourceMapContent: string, cwd: string, original: input.File): void;
    writeDts(base: string, fileName: string, content: string, cwd: string): void;
    private applySourceMap;
    finish(result: reporter.CompilationResult): void;
    private getError;
    diagnostic(info: ts.Diagnostic): void;
    error(error: reporter.TypeScriptError): void;
}
