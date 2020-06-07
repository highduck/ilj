import path from "path";
import yargs from "yargs";
import {deleteFolderRecursive, execute, isFile} from "./common/utility";
import {build} from "./iljwebpack/build";
import console from "./common/log";
import {appicon} from "./bins/appicon";
import {BuildMode, NProject, NProjectTarget} from "./proj/NProject";
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
            target: {type: 'string', alias: 't', default: 'none'},
            analyze: {type: 'boolean', alias: 'a', default: false},
            live: {type: 'boolean', alias: 'l', default: false},
            old: {type: 'boolean', default: false}
        }), async (args) => {
            const target = NProjectTarget.load(process.cwd());
            console.debug(target);
            if(target) {
                // clean target output folder
                deleteFolderRecursive(target.appdir);
                await build(
                    target,
                    args.mode as BuildMode,
                    args.analyze as boolean,
                    args.live as boolean
                );
            }
            // await NProject.load(process.cwd()).run({
            //     target: args.target as string,
            //     mode: args.mode as BuildMode,
            //     analyze: args.analyze as boolean,
            //     live: args.live as boolean
            // });
        })
    // .command('publish', 'publish target',
    //     (yargs) => yargs.options({
    //         target: {array: false, alias: 't', default: 'web'}
    //     }), async (args) => {
    //         const config = loadConfig(process.cwd());
    //         if (config) {
    //             console.debug(`PUBLISH`, config);
    //             // clean target output folder
    //             deleteFolderRecursive(config.appdir);
    //             await build(config, 'production', false, false);
    //             if (config.platform === 'web') {
    //                 const firebaseHostingConfig = path.resolve(config.approot, 'firebase.json');
    //                 if (isFile(firebaseHostingConfig)) {
    //                     execute('firebase', ['deploy'], config.approot);
    //                 }
    //             }
    //         }
    //     })
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