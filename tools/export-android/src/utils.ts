import resolve from "resolve";
import {spawnSync} from "child_process";
import {copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync} from "fs";
import path from "path";

const bin_cap = resolve.sync("@capacitor/cli/bin/capacitor");

export function cap(args: string[], dir: string) {
    const child = spawnSync(bin_cap, args, {
            stdio: 'pipe',
            encoding: 'utf-8',
            cwd: dir
        }
    );
    console.log(child.stderr.toString());
    console.log(child.stdout.toString());
    if (child.error) {
        throw child.error;
    }
    if (child.status !== 0) {
        throw 'CAP error: ' + child.status;
    }
}

export function copyFolderRecursiveSync(source: string, target: string) {
    if (!existsSync(target)) {
        mkdirSync(target, {recursive: true});
    }

    //copy
    if (lstatSync(source).isDirectory()) {
        readdirSync(source).forEach(function (file) {
            const curSource = path.join(source, file);
            if (lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, path.join(target, file));
            } else {
                copyFileSync(curSource, path.join(target, file));
            }
        });
    }
}