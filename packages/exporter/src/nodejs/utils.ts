import fs from "fs";
import {spawnSync} from "child_process";

export function isDir(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

export function makeDirs(p: string) {
    if (!isDir(p)) {
        fs.mkdirSync(p, {recursive: true});
    }
}

export function execute(cmd: string, args: string[] = [], wd: undefined | string = undefined) {
    console.debug(">> " + [cmd].concat(args).join(" "));
    const cwd = wd ?? process.cwd();
    console.debug(`CWD: ${cwd}`);
    const child = spawnSync(cmd, args, {
            stdio: 'pipe',
            encoding: 'utf-8',
            cwd: cwd
        }
    );
    console.log("stderr", child.stderr ? child.stderr.toString() : null);
    console.log("stdout", child.stdout ? child.stdout.toString() : null);
    console.log("exit code", child.status);
    if (child.error) {
        console.error(child.error);
    }

    return child.status;
}

export function logDebug(...args: any[]) {
    console.info(...args);
}

export function logWarning(...args: any[]) {
    console.warn(...args);
}

export function logError(...args: any[]) {
    console.error(...args);
}

export function logAssert(val: any, message?: string, ...data: any[]) {
    console.assert(val, message, ...data);
}