#! /usr/bin/env node

console.debug('🚀 ilj tools 🚀');

const path = require('path');
const fs = require('fs');

const verboseEnabled = process.argv.indexOf("-v") > 0;
const tsMode =  process.argv.indexOf("--ts") > 0;

function trace(msg) {
    if (verboseEnabled) {
        console.info('🤖 ' + msg);
    }
}

const compiledEntryPath = path.resolve(__dirname, 'dist/index.js');

if (fs.existsSync(compiledEntryPath) && !tsMode) {
    trace(`running compiled js ${compiledEntryPath}`);
    require(compiledEntryPath);
} else {
    const opts = {
        project: path.resolve(__dirname, "tsconfig.json"),
        dir: __dirname
    };
    trace(`running ts-node version: ${opts.project} in ${opts.dir}`);
    require('ts-node').register(opts);

    trace("loading index.ts");
    require('./src/index.ts');
}