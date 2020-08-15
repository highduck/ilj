import {IOSProjectContext} from "./context";
import * as fs from "fs";
import * as path from "path";
import {makeIconIOS, makeSplashIOS} from "./images";
import * as xcode from 'xcode';

export async function exportIOS(basedir?: string, target?: string, mode?: 'production' | 'development', debug?: boolean, deploy?: boolean) {
    const ctx = new IOSProjectContext({basedir, target, mode, debug});

    ctx.initializeCapacitorProject();

    fs.copyFileSync(
        path.join(ctx.config.keys, 'GoogleService-Info.plist'),
        path.join(ctx.genProjDir, 'App/App/GoogleService-Info.plist')
    );

    await Promise.all([
        makeIconIOS(ctx.config.icon, ctx.genProjDir),
        makeSplashIOS(ctx.config.splash, ctx.genProjDir)
    ]);

    const infoPlistPath = path.join(ctx.genProjDir, 'App/App/Info.plist');
    let plist = fs.readFileSync(infoPlistPath, 'utf8');
    plist = plist.replace(`<dict>`,
        `<dict>
    <key>GADApplicationIdentifier</key>
    <string>${ctx.config.admobAppId}</string>`);
    fs.writeFileSync(infoPlistPath, plist);

    const projectPath = path.join(ctx.genProjDir, 'App/App.xcodeproj/project.pbxproj');
    const proj = xcode.project(projectPath);
    const prom = new Promise((resolve, reject) => {
        proj.parse((err: any) => {
            if (err) {
                reject(err);
            }
            const appGroup = proj.pbxGroupByName('App');
            console.info(appGroup);
            proj.addPbxGroup([], "Resources", "Resources");

            const fullpath = 'GoogleService-Info.plist';
            const file = proj.addResourceFile(fullpath, undefined, 'App');
            console.info(file);
            ((appGroup as any).children as any[]).push({
                value: file.fileRef,
                comment: file.basename
            });

            fs.writeFileSync(projectPath, proj.writeSync());
            console.log('new project written');
            resolve();
        });
    });
    await prom;

    //ctx.blitProject();
}
