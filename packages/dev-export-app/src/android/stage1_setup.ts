import {copyFileSync, readFileSync, writeFileSync} from "fs";
import path from "path";
import {AndroidProjectContext} from "./context";
import rimraf from "rimraf";

export function setupAndroidProject(ctx: AndroidProjectContext) {
    console.log('clear basic capacitor template files');

    rimraf.sync(path.join(ctx.genProjectResPath, 'mipmap-*/'));
    rimraf.sync(path.join(ctx.genProjectResPath, 'drawable*/'));

    console.log('override capacitor template files');
    ctx.generator.copyDir(path.join(ctx.packagerPath, 'templates/android'), ctx.genProjDir);

    console.info('replace MainActivity.java');
    {
        const mainActivityPath = path.join(ctx.genProjDir,
            `app/src/main/java/${ctx.appIdPath}/MainActivity.java`);
        copyFileSync(path.join(ctx.packagerPath, 'templates/android-tpls/MainActivity.java'),
            mainActivityPath);
        let content = readFileSync(mainActivityPath, 'utf8');
        content = content.replace('package i.have.to.flap;',
            `package ${ctx.config.appId};`);
        writeFileSync(mainActivityPath, content);
    }

    console.info('update variables.gradle');
    {
        const filepath = path.join(ctx.genProjDir, 'variables.gradle');
        let content = readFileSync(filepath, 'utf8');
        content = content.replace("appId = 'test.app'", `appId = '${ctx.config.appId}'`);
        content = content.replace("appVersionName = '1.0.0'", `appVersionName = '${ctx.config.version}'`);
        content = content.replace("appVersionCode = 1", `appVersionCode = ${ctx.config.versionCode}`);
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
    copyFileSync(path.join(ctx.config.keys, 'google-services.json'),
        path.join(ctx.genProjDir, 'app/google-services.json'));
}