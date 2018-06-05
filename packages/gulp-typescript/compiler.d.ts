import * as ts from "typescript";
import { Host } from "./host";
import { File } from "./input";
import { ProjectInfo } from "./project";
export interface Compiler {
    prepare(project: ProjectInfo): void;
    inputFile(file: File): void;
    inputDone(): void;
}
export declare class ProjectCompiler implements Compiler {
    host: Host;
    project: ProjectInfo;
    program: ts.Program;
    private hasSourceMap;
    prepare(project: ProjectInfo): void;
    inputFile(file: File): void;
    inputDone(): void;
    private attachContentToFile;
    private emit;
    private emitFile;
    private reportDiagnostics;
    private removeSourceMapComment;
}
export declare class FileCompiler implements Compiler {
    host: Host;
    project: ProjectInfo;
    private output;
    private previousOutput;
    private compilationResult;
    prepare(project: ProjectInfo): void;
    private write;
    inputFile(file: File): void;
    inputDone(): void;
}
