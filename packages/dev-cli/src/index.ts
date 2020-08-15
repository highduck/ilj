import path from "path";
import fs from "fs";
import yargs from "yargs";
import console from "./common/log";
import {appicon} from "./bins/appicon";
import {importAssets, optimizeImageFile} from "@highduck/exporter";
import {build as ccBuild, BuildOptions, watch as ccWatch} from '@highduck/tools-build-code';
import browserSync from "browser-sync";
import {BuildMode, PlatformType} from "./proj/NProject";
import {exportAppProject, exportWebTemplate, readAppConfig} from "@highduck/export-app";

const args = yargs
    .scriptName('ilj')
    .command('assets', 'import assets', {}, async (args) => {
        await importAssets("assets", "public/assets");
    })
    .command('optimize', 'optimize png and jpeg images with glob pattern',
        (yargs) => yargs.options({input: {type: 'array', array: true, alias: "i", default: []}}),
        (args) => {
            for (const f of args.input) {
                optimizeImageFile(f);
            }
        }
    )
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
            prod: {type: 'boolean', default: undefined, desc: 'shortcut for `--mode production` or `-m production`'},
            proj: {
                desc: "only project generation",
                type: 'boolean',
                default: false
            },
            stats: {type: 'boolean', alias: 's', default: undefined},
            debug: {type: 'boolean', alias: 'd', default: undefined},
            profile: {type: 'boolean', default: undefined},
            webgldebug: {type: 'boolean', default: undefined},
            deploy: {type: 'boolean', default: undefined}
        }),
        async (args) => {
            const platform: PlatformType = args.platform as PlatformType;
            const target = platform;
            const verbose = args.verbose as boolean;
            const wwwDestDir = `dist/${target}/www`;
            const buildMode = !!args.prod ? 'production' : args.mode as BuildMode;
            const flags = [];
            if (args.profile === true) {
                flags.push('ILJ_PROFILE');
            }
            if (args.webgldebug === true) {
                flags.push('ILJ_WEBGL_DEBUG');
            }
            if (args.proj === false) {
                const opts: Partial<BuildOptions> = {
                    mode: buildMode,
                    target: target,
                    platform: platform,
                    dir: wwwDestDir,
                    flags,
                    verbose
                };
                if (args.stats !== undefined) {
                    opts.stats = args.stats;
                }
                if (args.debug !== undefined) {
                    opts.debug = args.debug;
                }

                const bb = ccBuild(opts);
                const aa = importAssets("assets", path.join(wwwDestDir, 'assets'), opts.mode === 'production');
                await Promise.all([aa, bb]);

                const cwd = process.cwd();
                const pkg = readAppConfig(cwd);
                exportWebTemplate({
                    config: pkg, buildMode, flags, target, platform
                }, wwwDestDir);
            }
            await exportAppProject(target, buildMode, !!args.debug, undefined /* cwd */, !!args.deploy);
        })
    .command('start', 'Watch mode', (yargs) => yargs.options({}),
        async (args) => {
            const platform = 'web';
            const target = platform;
            const verbose = true;
            const buildRoot = `build/${target}`;
            const buildMode = 'development';
            const flags: string[] = []; // TODO:

            const watchTask = ccWatch({
                modules: true,
                mode: buildMode,
                target: target,
                platform: platform,
                stats: false,
                minify: false,
                compat: false,
                debug: true,
                sourceMap: true,
                flags,
                dir: `${buildRoot}/scripts`,
                verbose
            });

            const assetsTask = importAssets("assets", `${buildRoot}/content/assets`);

            const pkg = readAppConfig(process.cwd());
            exportWebTemplate({
                config: pkg,
                buildMode: buildMode,
                target: target,
                platform: platform,
                flags
            }, `${buildRoot}/content`);

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