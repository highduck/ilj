import {Entry} from "./Entry";
import fs from "fs";
import path from "path";
import {XFLEntry} from "./XFLEntry";
import {FLAEntry} from "./FLAEntry";
import {logError, logWarning} from "../debug";

function isDir(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

function isFile(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isFile();
}

function loadFLA(filepath: string): FLAEntry {
    const buffer = fs.readFileSync(filepath);
    return FLAEntry.fromZipBuffer(new Uint8Array(buffer));
}

export function loadFlashArchive(filepath: string): Entry | undefined {
    if (isFile(filepath)) {
        const ext = path.extname(filepath);
        // dir/FILE/FILE.xfl
        if (ext === ".xfl") {
            const dir = path.dirname(filepath);
            if (isDir(dir)) {
                return new XFLEntry(dir);
            } else {
                logError(`Import Flash: loading ${filepath} XFL file, but ${dir} is not a dir`);
            }
        } else if (ext === ".fla") {
            return loadFLA(filepath);
        } else {
            logError(`Import Flash: file is not xfl or fla: ${filepath} | ext: ${ext}`);
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

    logError("Import Flash: file not found: " + filepath);

    return undefined;
}