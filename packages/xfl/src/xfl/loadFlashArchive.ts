import {Entry} from "./Entry";
import fs from "fs";
import path from "path";
import {XFLEntry} from "./XFLEntry";
import {FLAEntry} from "./FLAEntry";

function isDir(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

function isFile(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isFile();
}

export function loadFlashArchive(filepath: string): Entry | undefined {
    if (isFile(filepath)) {
        const ext = path.extname(filepath);
        // dir/FILE/FILE.xfl
        if (ext === "xfl") {
            const dir = path.dirname(filepath);
            if (isDir(dir)) {
                return new XFLEntry(dir);
            } else {
                console.error(`Import Flash: loading ${filepath} XFL file, but ${dir} is not a dir`);
            }
        } else if (ext === "fla") {
            return FLAEntry.fromZip(filepath);
        } else {
            console.error(`Import Flash: file is not xfl or fla: ${filepath}`);
        }
    }

    // dir/FILE.fla
    const fla_file = filepath + ".fla";
    if (isFile(fla_file)) {
        return FLAEntry.fromZip(fla_file);
    } else if (isDir(filepath)) {
        if (isFile(path.join(filepath, path.basename(filepath) + ".xfl"))) {
            return new XFLEntry(filepath);
        } else {
            console.warn("Import Flash: given dir doesn't contain .xfl file: " + filepath);
        }
    }

    console.error("Import Flash: file not found: " + filepath);

    return undefined;
}