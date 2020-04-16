import {spawnSync} from "child_process";
import * as glob from "glob";
import path from "path";
import yargs from "yargs";
import {deleteFolderRecursive, execute, is_file, make_dirs} from "./common/utility";
import {build} from "./iljwebpack/build";
import {loadConfig} from "./config/loadConfig";
import console from "./common/log";
import pngquant from 'pngquant-bin';
import resolve from 'resolve';
import {appicon} from "./bins/appicon";

const exporterBin = resolve.sync('@highduck/exporter/bin/exporter');

function optimize_png(input: string, output?: string) {
    if (!output) {
        output = input;
    }
    const result = spawnSync(pngquant, [
        "--strip",
        "--force",
        "-o", output,
        input
    ]);
    if (result.status === 0) {
        console.log('Image minified! ' + input);
    } else {
        console.warn(result.stderr.toString());
        console.warn(result.status);
    }
}

function optimize_png_glob(input_pattern: string) {
    const files = glob.sync(input_pattern);
    for (const file of files) {
        optimize_png(file, file);
    }
}

function ekc_export_market(market_asset: string, target_type: string, output: string) {
    // const market_asset = "assets/res";
    // const target_type = "market";
    // const output = "output/res";
    make_dirs(output);
    execute(exporterBin, ["export", "market", market_asset, target_type, output]);
}

function ekc_export_assets(assets_input: string, assets_output: string) {
    make_dirs(assets_output);
    execute(exporterBin, ["export", "assets", assets_input, assets_output]);
    optimize_png_glob(path.join(assets_output, "*.png"));
}

function prepare_sfx_files() {
    const files = glob.sync("assets/**/*.mp3");
    for (const file of files) {
        const output = file.replace("assets/", "public/assets/");
        try {
            console.log("input: " + file);
            console.log("output: " + output);
            make_dirs(path.dirname(output));
            execute("ffmpeg", ["-y", "-i", file, "-map_metadata", "-1", "-codec:a", "libmp3lame", "-q:a", "8", output]);
        } catch (e) {
            console.log(e);
        }
    }
}

const args = yargs
    .command('export', 'export assets', {}, (args) => {
        ekc_export_assets("assets", "public/assets");
    })
    .command('sfx', 'prepare audio files', {}, (args) => {
        prepare_sfx_files();
    })
    .command('market', 'export marketing assets', {}, (_) => {
        ekc_export_market("assets/res", "gen", "export/market");
    })
    .command('pngquant', 'exposed optimizer for png with glob pattern',
        (yargs) => yargs.options({input: {type: 'array', array: true, alias: "i", default: []}}),
        (args) => {
            for (const f of args.input) {
                optimize_png(f, f);
            }
        }
    )
    .command('build', 'build target',
        (yargs) => yargs.options({
            mode: {type: 'string', alias: 'm', default: 'development'},
            target: {type: 'string', alias: 't', default: 'pwa'},
            analyze: {type: 'boolean', alias: 'a', default: false},
            live: {type: 'boolean', alias: 'l', default: false}
        }), async (args) => {
            const config = loadConfig(process.cwd());
            if (config) {
                console.debug(`> BUILD`, config);
                // clean target output folder
                deleteFolderRecursive(config.appdir);

                await build(
                    config,
                    args.mode as string,
                    args.analyze as boolean,
                    args.live as boolean
                );
            }
        })
    .command('publish', 'publish target',
        (yargs) => yargs.options({
            target: {array: false, alias: 't', default: 'web'}
        }), async (args) => {
            const config = loadConfig(process.cwd());
            if (config) {
                console.debug(`PUBLISH`, config);
                // clean target output folder
                deleteFolderRecursive(config.appdir);
                await build(config, 'production', false, false);
                if (config.platform === 'web') {
                    const firebaseHostingConfig = path.resolve(config.approot, 'firebase.json');
                    if (is_file(firebaseHostingConfig)) {
                        execute('firebase', ['deploy'], config.approot);
                    }
                }
            }
        })
    .command('icon', 'Update icon', (yargs) => yargs.options({
            input: {
                type: 'string',
                array: false,
                alias: "i",
                default: []
            }
        }),
        (args) => {
            appicon('generate');
        })
    .onFinishCommand(
        (_) => {
            console.info(`‍job's done! 🙈`);
        }
    )
    .argv;