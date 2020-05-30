import path from "path";
import fs from "fs";
import {execute, logWarning, makeDirs} from "../env";

export function copySound(input: string, output: string, compress: boolean) {
    try {
        makeDirs(path.dirname(output));
        if (compress) {
            execute("ffmpeg", ["-y", "-i", input, "-map_metadata", "-1", "-codec:a", "libmp3lame", "-q:a", "8", output]);
        } else {
            fs.copyFileSync(input, output);
        }
    } catch (e) {
        logWarning(e);
    }
}