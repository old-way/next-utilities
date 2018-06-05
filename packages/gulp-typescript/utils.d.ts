import * as ts from "typescript";
import { File } from "./input";
import * as reporter from "./reporter";
export interface Map<T> {
    [key: string]: T;
}
export declare function forwardSlashes(fileName: string): string;
export declare function normalizePath(pathString: string): string;
export declare function splitExtension(fileName: string, knownExtensions?: Array<string>): [string, string];
export declare function getCommonBasePath(a: string, b: string): string;
export declare function getCommonBasePathOfArray(paths: Array<string>): string;
export declare function getError(info: ts.Diagnostic, typescript: typeof ts, file?: File): reporter.TypeScriptError;
export declare function deprecate(title: string, alternative: string, description?: string): void;
export declare function message(title: string, alternative: string, description?: string): void;
