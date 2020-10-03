import {IOSProjectContext} from "./context";
import * as fs from "fs";
import * as path from "path";
import {makeIconIOS, makeSplashIOS} from "./images";
import xcode from 'xcode';
import plist from 'plist';

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

    const infoPListPath = path.join(ctx.genProjDir, 'App/App/Info.plist');
    const obj:any = plist.parse(fs.readFileSync(infoPListPath, 'utf-8'));
    if (ctx.config.admobAppIds?.ios) {
        obj.GADApplicationIdentifier = ctx.config.admobAppIds.ios;
    }
    obj.CFBundleDisplayName = ctx.config.appName;
    obj.CFBundleVersion = ctx.config.versionCode.toString();
    obj.CFBundleShortVersionString = ctx.config.version;
    obj.UIRequiredDeviceCapabilities = [
        'armv7',
        'gamekit'
        //?? where is in-app-purchases? (could be done automatic signing mode )
    ];
    if(ctx.config.orientation === 'portrait') {
        obj.UISupportedInterfaceOrientations = [
            'UIInterfaceOrientationPortrait'
        ];
        obj['UISupportedInterfaceOrientations~ipad'] = [
            'UIInterfaceOrientationPortrait',
            'UIInterfaceOrientationPortraitUpsideDown'
        ];
    }
    else {
        obj.UISupportedInterfaceOrientations = [
            'UIInterfaceOrientationLandscapeLeft',
            'UIInterfaceOrientationLandscapeRight'
        ];
        obj['UISupportedInterfaceOrientations~ipad'] = [
            'UIInterfaceOrientationLandscapeLeft',
            'UIInterfaceOrientationLandscapeRight'
        ];
    }
    obj.UIRequiresFullScreen = true;
    obj.UIStatusBarHidden = true;
    obj.UIStatusBarStyle = 'UIStatusBarStyleDefault';
    obj.UIViewControllerBasedStatusBarAppearance = false;

    // TODO:
    /*
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<true/>
     */
    fs.writeFileSync(infoPListPath, plist.build(obj));

    const projectPath = path.join(ctx.genProjDir, 'App/App.xcodeproj/project.pbxproj');

    let pbx = fs.readFileSync(projectPath, 'utf-8');
    const teamID = ctx.config.ios?.teamID;
    const developmentTeam = teamID ? `DEVELOPMENT_TEAM = "${teamID}";` : '';

    // MARKETING_VERSION = ${ctx.config.version};
    // CURRENT_PROJECT_VERSION = ${ctx.config.versionCode};
    pbx = pbx.replace(/PRODUCT_BUNDLE_IDENTIFIER = .*;/g,
        `PRODUCT_BUNDLE_IDENTIFIER = ${ctx.config.appId};
        ${developmentTeam}
        `);

    fs.writeFileSync(projectPath, pbx);

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
