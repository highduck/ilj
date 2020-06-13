#!/usr/bin/env node --experimental-specifier-resolution=node

import path from 'path';
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';

console.debug('🚀 ilj tools 🚀');

function run(file) {
    spawn('node', [
        '--experimental-specifier-resolution=node',
        file,
        ...process.argv.splice(2)
    ], {
        cwd: process.cwd(),
        //detached: true,
        stdio: "inherit"
    });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compiledEntryPath = path.resolve(__dirname, 'dist/index.js');

// import(compiledEntryPath);
run(compiledEntryPath);
