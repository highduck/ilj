import path from "path";
import yargs from "yargs";
import {deleteFolderRecursive, execute, is_file} from "./common/utility";
import {build} from "./iljwebpack/build";
import {loadConfig} from "./config/loadConfig";
import console from "./common/log";
import {appicon} from "./bins/appicon";
import {exportAssets, exportMarketingAssets, pngQuant} from "./export/Export";

const args = yargs
    .command('export', 'export assets', {}, async (args) => {
        await exportAssets("assets", "public/assets");
    })
    .command('market', 'export marketing assets', {}, (_) => {
        exportMarketingAssets("assets/res", "gen", "export/market");
    })
    .command('pngquant', 'exposed optimizer for png with glob pattern',
        (yargs) => yargs.options({input: {type: 'array', array: true, alias: "i", default: []}}),
        (args) => {
            for (const f of args.input) {
                pngQuant(f, f);
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