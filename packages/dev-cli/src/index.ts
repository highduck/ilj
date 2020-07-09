import path from "path";
import fs from "fs";
import yargs from "yargs";
import console from "./common/log";
import {appicon} from "./bins/appicon";
import {exportAssets, optimizeImageFile} from "@highduck/exporter";
import {build as ccBuild, BuildOptions, watch as ccWatch} from '@highduck/tools-build-code';
import browserSync from "browser-sync";
import {BuildMode, PlatformType} from "./proj/NProject";
import {copyPublic, exportAndroid, readPkg} from "@highduck/export-android";

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
                default: false
            },
            stats: {type: 'boolean', alias: 's', default: undefined},
            debug: {type: 'boolean', alias: 'd', default: undefined}
        }),
        async (args) => {
            const platform: PlatformType = args.platform as PlatformType;
            const target = platform;
            const verbose = args.verbose as boolean;
            const dest = `dist/www/${target}`;
            const buildMode = args.mode as BuildMode;

            if (args.proj === false) {
                const opts: Partial<BuildOptions> = {
                    mode: buildMode,
                    target: target,
                    platform: platform,
                    dir: dest,
                    verbose
                };
                if (args.stats !== undefined) {
                    opts.stats = args.stats;
                }
                if (args.debug !== undefined) {
                    opts.debug = args.debug;
                }

                const bb = ccBuild(opts);
                const aa = exportAssets("assets", path.join(dest, 'assets'), opts.mode === 'production');
                await Promise.all([aa, bb]);

                const pkg = readPkg(process.cwd());
                copyPublic({
                    src: 'public_' + target,
                    dest: dest,
                    pkg: pkg,
                    buildMode: buildMode,
                    target: target,
                    platform: platform
                });
            }
            if (platform === 'android') {
                exportAndroid(undefined, target, args.mode as BuildMode, args.debug);
            }
        })
    .command('start', 'Watch mode', (yargs) => yargs.options({}),
        async (args) => {
            const platform = 'web';
            const target = platform;
            const verbose = true;
            const buildRoot = `build/${target}`;

            const watchTask = ccWatch({
                modules: true,
                mode: 'development',
                target: target,
                platform: platform,
                stats: true,
                minify: false,
                compat: false,
                debug: true,
                sourceMap: true,
                dir: `${buildRoot}/scripts`,
                verbose
            });

            const assetsTask = exportAssets("assets", `${buildRoot}/content/assets`);

            await Promise.all([watchTask, assetsTask]);

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
            await new Promise((resolve) => {
                // wait until kill
            });
        })
    .command('serve', 'serve output', (yargs) => yargs.options({
            platform: {choices: ['web', 'android', 'ios'], type: 'string', alias: 'p', default: 'web'},
            target: {type: 'string', alias: 't', default: undefined},

        }),
        async (args) => {
            const platform = args.platform;
            const target = args.target ?? platform;
            const serveRoot = `dist/www/${target}`;

            try {
                const p = browserSync.get('ll');
                if (p) {
                    p.exit();
                }
            } catch {
            }
            const bs = browserSync.create('ll');
            const roots = [serveRoot];

            bs.init({
                server: roots
            });
            await new Promise((resolve) => {
                // wait until kill
            });
        })
    .onFinishCommand(
        (_) => {
            console.info(`‍job's done! 🙈`);
        }
    )
    .argv;