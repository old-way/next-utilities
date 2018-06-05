/// <reference types="node" />
import * as stream from "stream";
import * as ts from "typescript";
import { Compiler } from "./compiler";
import { FileCache } from "./input";
import { Output } from "./output";
import { Reporter } from "./reporter";
import { TsConfig } from "./types";
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
export declare function setupProject(projectDirectory: string, configFileName: string, rawConfig: any, config: TsConfig, options: ts.CompilerOptions, typescript: typeof ts): Project;
export interface CompileStream extends NodeJS.ReadWriteStream {
    js: stream.Readable;
    dts: stream.Readable;
}
declare class CompileStream extends stream.Duplex implements CompileStream {
    constructor(project: ProjectInfo);
    private project;
    _write(file: any, encoding: string, cb: (err?: any) => void): void;
    _read(): void;
    end(chunk?: any, encoding?: any, callback?: any): void;
    js: stream.Readable;
    dts: stream.Readable;
}
export {};
