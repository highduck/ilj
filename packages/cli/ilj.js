#! /usr/bin/env node

console.debug('🚀 ilj tools 🚀');

const path = require('path');
const fs = require('fs');

const verboseEnabled = process.argv.indexOf("-v") > 0;
const tsMode = process.argv.indexOf("--ts") > 0;

function trace(msg) {
    if (verboseEnabled) {
        console.info('🤖 ' + msg);
    }
}

const compiledEntryPath = path.resolve(__dirname, 'dist/commonjs/index.js');

if (fs.existsSync(compiledEntryPath) && !tsMode) {
    trace(`running compiled js ${compiledEntryPath}`);
    require(compiledEntryPath);
} else {

    // const opts = {
    //     project: path.resolve(__dirname, "tsconfig.commonjs.json"),
    //     dir: __dirname
    // };
    // trace(`running ts-node version: ${opts.project} in ${opts.dir}`);
    // require('ts-node').register(opts);
    //
    // trace("loading index.ts");
    // require('./src/index.ts');
    if (compile(path.resolve(__dirname, "tsconfig.commonjs.json"))) {
        require(compiledEntryPath);
    } else {
        process.exit(1);
    }
}

function compile(configPath) {
    const ts = require('typescript');

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