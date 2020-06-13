import path from "path";
import fs from "fs";
import yargs from "yargs";
import {copyFolderRecursiveSync} from "./common/utility";
import console from "./common/log";
import {appicon} from "./bins/appicon";
import {exportAssets, optimizeImageFile} from "@highduck/exporter";
import {build as ccBuild, watch as ccWatch} from '@highduck/tools-build-code';
import {exportAndroid} from '@highduck/export-android';
import browserSync from "browser-sync";
import {BuildMode, PlatformType} from "./proj/NProject";

const args = yargs
    .scriptName('ilj')
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
    // .command('build', 'build project',
    //     (yargs) => yargs.options({
    //         mode: {type: 'string', alias: 'm', default: 'development'},
    //         target: {type: 'string', alias: 't', default: 'none'},
    //         analyze: {type: 'boolean', alias: 'a', default: false},
    //         live: {type: 'boolean', alias: 'l', default: false},
    //         old: {type: 'boolean', default: false}
    //     }), async (args) => {
    //         const target = NProjectTarget.load(process.cwd());
    //         console.debug(target);
    //         if (target) {
    //             target.deleteWWW();
    //             await build(
    //                 target,
    //                 args.mode as BuildMode,
    //                 args.analyze as boolean,
    //                 args.live as boolean
    //             );
    //         }
    //         // await NProject.load(process.cwd()).run({
    //         //     target: args.target as string,
    //         //     mode: args.mode as BuildMode,
    //         //     analyze: args.analyze as boolean,
    //         //     live: args.live as boolean
    //         // });
    //     })
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
    .command('build', 'Build TypeScript project and compile JavaScript bundle', (yargs) => yargs.options({
            mode: {choices: ['development', 'production'], type: 'string', alias: 'm', default: 'development'},
            platform: {choices: ['web', 'android', 'ios'], type: 'string', alias: 'p', default: 'web'},
            verbose: {type: 'boolean', alias: 'v', default: false},
            proj: {
                desc: "only project generation",
                type: 'boolean',
                alias: "p",
                default: false
            }
        }),
        async (args) => {
            const platform: PlatformType = args.platform as PlatformType;
            const target = platform;
            const verbose = args.verbose as boolean;
            const dest = `dist/www/${target}`;
            // if (args.proj === false) {
                await ccBuild({
                    bundle: {
                        mode: args.mode as BuildMode,
                        target: target,
                        platform: platform,
                        stats: true,
                        dir: dest,
                        verbose
                    },
                    verbose
                });
                await exportAssets("assets", path.join(dest, 'assets'));
                copyFolderRecursiveSync('public_' + target, dest);
            // }
            if (platform === 'android') {
                exportAndroid();
            }
        })
    .command('start', 'Watch mode', (yargs) => yargs.options({}),
        async (args) => {
            const platform = 'web';
            const target = platform;
            const verbose = true;
            const buildRoot = `build/${target}`;

            await exportAssets("assets", `${buildRoot}/content/assets`);

            ccWatch({
                bundle: {
                    modules: true,
                    mode: 'development',
                    target: target,
                    platform: platform,
                    stats: true,
                    minify: false,
                    compat: false,
                    dir: `${buildRoot}/scripts`,
                    verbose
                },
                verbose
            }).then();

            try {
                const p = browserSync.get('ll');
                if (p) {
                    p.exit();
                }
            } catch {
            }
            const bs = browserSync.create('ll');
            const roots = [
                'public_' + target,
                `${buildRoot}/content`,
                `${buildRoot}/scripts`
            ];

            const bsWatchCallback = (event: string, file: fs.Stats): any => {
                console.log(event, file);
                if (event === "change") {
                    bs.reload("*.html");
                }
            };
            for (const root of roots) {
                bs.watch(
                    path.join(root, '**/*'),
                    undefined,
                    bsWatchCallback
                );
            }
            bs.init({
                server: roots
            });
        })
    .onFinishCommand(
        (_) => {
            console.info(`‍job's done! 🙈`);
        }
    )
    .argv;