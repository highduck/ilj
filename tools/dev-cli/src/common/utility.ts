import {spawnSync} from "child_process";
import fs from "fs";
import path from "path";
import glob from "glob";
import console from "./log";

export function replace_all(str: string, search: string, replacement: string): string {
    return str.split(search).join(replacement);
}

export function read_text(filepath: string): string {
    return fs.readFileSync(filepath, "utf8");
}

export function write_text(filepath: string, text: string): void {
    fs.writeFileSync(filepath, text, "utf8");
}

export function replace_in_file(filepath: string, dict: { [s: string]: string }) {
    let text = read_text(filepath);
    for (const [k, v] of Object.entries(dict)) {
        text = replace_all(text, k, v);
    }
    write_text(filepath, text);
}

export function search_files(pattern: string, search_path: string, out_files_list: string[]) {
    const files = glob.sync(pattern, {
        cwd: search_path
    });
    for (let file of files) {
        out_files_list.push(path.join(search_path, file));
    }
}

export function copyFolderRecursiveSync(source: string, target: string) {
    makeDirs(target);

    //copy
    if (fs.lstatSync(source).isDirectory()) {
        fs.readdirSync(source).forEach(function (file) {
            const curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, path.join(target, file));
            } else {
                fs.copyFileSync(curSource, path.join(target, file));
            }
        });
    }
}

export function deleteFolderRecursive(p: string) {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach(function (file, index) {
            const curPath = p + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
}

export function copyFile(src: string, dest: string) {
    fs.copyFileSync(src, dest);
}

export function isFile(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isFile();
}

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