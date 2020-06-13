import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import pngquant from 'pngquant-bin';
import jpegtran from 'jpegtran-bin';

export function optimizeImageFile(filepath: string, grayscale: boolean = false) {
    const ext = path.extname(filepath);
    const tmpPath = filepath + "_opt" + ext;
    const size0 = fs.statSync(filepath).size;
    const args = [];
    let bin = "";
    if (ext === '.png') {
        bin = pngquant;
        args.push("--strip", "-o", tmpPath, filepath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
        bin = jpegtran;
        args.push('-copy', 'none', '-optimize');
        if (grayscale) {
            args.push("-grayscale");
        }
        args.push('-outfile', tmpPath, filepath);
    }
    const result = spawnSync(bin, args);
    if (result.status === 0) {
        const delta = Math.trunc((size0 - fs.statSync(tmpPath).size) / 1000);
        if (delta > 0) {
            fs.renameSync(tmpPath, filepath);
            console.log(`Image optimized: -${delta} kB\n\t${filepath}`);
        } else {
            fs.unlinkSync(tmpPath);
        }
    } else {
        console.warn(result.stderr.toString());
        console.warn(result.status);
    }
}