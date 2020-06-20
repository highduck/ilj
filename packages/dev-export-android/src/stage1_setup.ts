import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import path from "path";
import {copyFolderRecursiveSync} from "./utils";
import {AndroidProjectContext} from "./context";
import rimraf from "rimraf";

export function setupAndroidProject(ctx: AndroidProjectContext) {
    console.log('simple update templates');
    copyFolderRecursiveSync(path.join(ctx.packagerPath, 'templates/android'), ctx.genProjDir);

    console.info('replace MainActivity.java');
    {
        const mainActivityPath = path.join(ctx.genProjDir,
            `app/src/main/java/${ctx.appIdPath}/MainActivity.java`);
        copyFileSync(path.join(ctx.packagerPath, 'templates/android-tpls/MainActivity.java'),
            mainActivityPath);
        let content = readFileSync(mainActivityPath, 'utf8');
        content = content.replace('package i.have.to.flap;',
            `package ${ctx.pkg.appId};`);
        writeFileSync(mainActivityPath, content);
    }

    console.info('update variables.gradle');
    {
        const filepath = path.join(ctx.genProjDir, 'variables.gradle');
        let content = readFileSync(filepath, 'utf8');
        content = content.replace("appId = 'test.app'", `appId = '${ctx.pkg.appId}'`);
        content = content.replace("appVersionName = '1.0.0'", `appVersionName = '${ctx.pkg.version}'`);
        content = content.replace("appVersionCode = 1", `appVersionCode = ${ctx.pkg.versionCode}`);
        writeFileSync(filepath, content);
    }

    console.info('update app/build.gradle');
    {
        const filepath = path.join(ctx.genProjDir, 'app/build.gradle');
        let content = readFileSync(filepath, 'utf8');
        content = content.replace(`implementation "com.google.firebase:firebase-messaging:$firebaseMessagingVersion"`,
            `implementation platform("com.google.firebase:firebase-bom:$firebaseBoMVersion")
implementation 'com.google.firebase:firebase-messaging'`
        );
        writeFileSync(filepath, content);
    }

    console.info('copy google-services.json');
    copyFileSync(path.join(ctx.basedir, 'project_android/google-services.json'),
        path.join(ctx.genProjDir, 'app/google-services.json'));

    console.info('copy res files');

    rimraf.sync(path.join(ctx.genProjDirs.res, 'mipmap-*/'));
    rimraf.sync(path.join(ctx.genProjDirs.res, 'drawable*/'));

    for (const dir of [
        'drawable',
        'mipmap-anydpi-v26',
        'mipmap-hdpi',
        'mipmap-ldpi',
        'mipmap-mdpi',
        'mipmap-xhdpi',
        'mipmap-xxhdpi',
        'mipmap-xxxhdpi'
    ]) {
        copyFolderRecursiveSync(
            path.join(ctx.basedir, 'project_android/res', dir),
            path.join(ctx.genProjDirs.res, dir)
        );
    }

    copyFileSync(path.join(ctx.basedir,
        'project_android/res',
        'values/ic_launcher_background.xml'),
        path.join(ctx.genProjDirs.res, 'values/ic_launcher_background.xml'));

    for (const file of [
        'values/games-ids.xml',
        'values/keep.xml',
        'values/strings.xml',
        'values/styles.xml',
        'values-ru/strings.xml',
        'drawable/splash.png',
        'drawable/launch_splash.xml'

    ]) {
        const destPath = path.join(ctx.genProjDirs.res, file);
        const destDir = path.dirname(destPath);
        if (!existsSync(destDir)) {
            mkdirSync(destDir, {recursive: true});
        }
        copyFileSync(path.join(ctx.basedir, 'project_android/res', file), destPath);
    }
}