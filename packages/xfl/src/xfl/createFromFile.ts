import {Entry} from "./Entry";
import fs from "fs";
import path from "path";
import {XFLEntry} from "./XFLEntry";
import {FLAEntry} from "./FLAEntry";
import {logWarning} from "./debug";
import {Zip} from "@highduck/zipfile";

function isDir(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

function isFile(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isFile();
}

function loadFLA(filepath: string): FLAEntry {
    const buffer = fs.readFileSync(filepath);
    const zipFile = new Zip(new Uint8Array(buffer));
    return new FLAEntry("", zipFile);
}

export function createFromFile(filepath: string): Entry {
    if (isFile(filepath)) {
        const ext = path.extname(filepath);
        // dir/FILE/FILE.xfl
        if (ext === ".xfl") {
            const dir = path.dirname(filepath);
            if (isDir(dir)) {
                return new XFLEntry(dir);
            } else {
                throw `Import Flash: loading ${filepath} XFL file, but ${dir} is not a dir`;
            }
        } else if (ext === ".fla") {
            return loadFLA(filepath);
        } else {
            throw`Import Flash: file is not xfl or fla: ${filepath} | ext: ${ext}`;
        }
    }

    // dir/FILE.fla
    const flaFile = filepath + ".fla";
    if (isFile(flaFile)) {
        return loadFLA(flaFile);
    } else if (isDir(filepath)) {
        if (isFile(path.join(filepath, path.basename(filepath) + ".xfl"))) {
            return new XFLEntry(filepath);
        } else {
            logWarning("Import Flash: given dir doesn't contain .xfl file: " + filepath);
        }
    }

    throw"Import Flash: file not found: " + filepath;
}