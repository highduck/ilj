import path from "path";
import yargs from "yargs";
import {deleteFolderRecursive, execute, isFile} from "./common/utility";
import {build} from "./iljwebpack/build";
import {loadConfig} from "./proj/loadConfig";
import console from "./common/log";
import {appicon} from "./bins/appicon";
import {NProject} from "./proj/NProject";
import {exportAssets, optimizeImageFile} from "@highduck/exporter";

const args = yargs
    .command('export', 'export assets', {}, async (args) => {
        await exportAssets("assets", "public/assets");
    })
    .command('optimize', 'optimize png and jpeg images with glob pattern',
        (yargs) => yargs.options({input: {type: 'array', array: true, alias: "i", default: []}}),
        (args) => {
            for (const f of args.input) {
                optimizeImageFile(f);
            }
        }
    )
    .command('build', 'build project',
        (yargs) => yargs.options({
            mode: {type: 'string', alias: 'm', default: 'development'},
            target: {type: 'string', alias: 't', default: 'pwa'},
            analyze: {type: 'boolean', alias: 'a', default: false},
            live: {type: 'boolean', alias: 'l', default: false},
            old: {type: 'boolean', default: false}
        }), async (args) => {
            if(args.old) {
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
            }
            else {
                await NProject.load(process.cwd()).run({
                    target: args.target as string,
                    mode: args.mode as string,
                    analyze: args.analyze as boolean,
                    live: args.live as boolean
                });
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
                    if (isFile(firebaseHostingConfig)) {
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