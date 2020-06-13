#!/usr/bin/env node --experimental-specifier-resolution=node

import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import ts from 'typescript';
import {spawn} from 'child_process';

console.debug('🚀 ilj tools 🚀');

const verboseEnabled = process.argv.indexOf("-v") > 0;
const tsMode = process.argv.indexOf("--ts") > 0;

function trace(msg) {
    if (verboseEnabled) {
        console.info('🤖 ' + msg);
    }
}

function run(file) {
    spawn('node', [
        '--experimental-specifier-resolution=node',
        file,
        ...process.argv.splice(2)
    ], {
        cwd: process.cwd(),
        detached: true,
        stdio: "inherit"
    });
    // import(file);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compiledEntryPath = path.resolve(__dirname, 'dist/index.js');

if (fs.existsSync(compiledEntryPath) && !tsMode) {
    trace(`Run pre-compiled: ${compiledEntryPath}`);
    run(compiledEntryPath);
} else {
    trace(`Build TypeScript project...`);
    if (compile(path.resolve(__dirname, "tsconfig.esm.json"))) {
        run(compiledEntryPath);
    } else {
        process.exit(1);
    }
}

function compile(configPath) {
    function reportDiagnostics(diagnostics) {
        diagnostics.forEach(diagnostic => {
            let message = "Error";
            if (diagnostic.file) {
                const where = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                message += ' ' + diagnostic.file.fileName + ' ' + where.line + ', ' + where.character + 1;
            }
            message += ": " + ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(message);
        });
    }

    // Extract configuration from config file

    // Read config file
    const configFileText = fs.readFileSync(configPath).toString();

    // Parse JSON, after removing comments. Just fancier JSON.parse
    const result = ts.parseConfigFileTextToJson(configPath, configFileText);
    const configObject = result.config;
    if (!configObject) {
        reportDiagnostics([result.error]);
        process.exit(1);
    }

    // Extract config information
    const config = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configPath));
    if (config.errors.length > 0) {
        reportDiagnostics(config.errors);
        process.exit(1);
    }

    // Compile
    const program = ts.createProgram(config.fileNames, config.options);
    const emitResult = program.emit();

    // Report errors
    reportDiagnostics(ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics));

    // Return code
    return !emitResult.emitSkipped;
}