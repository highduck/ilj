import {readFileSync, writeFileSync} from "fs";
import path from "path";
import {AndroidProjectContext} from "./context";

export function patchAndroidManifest(ctx: AndroidProjectContext) {

    const orientation = ctx.orientation === 'portrait' ? 'sensorPortrait' : 'sensorLandscape';

    const removeStrings = [
        '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
        '<uses-feature android:name="android.hardware.location.gps" />',
        '<uses-feature android:name="android.hardware.location.network" />',
        '<uses-permission android:name="android.permission.CAMERA" />',
        '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
        '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>'
    ];

    const addStrings = [
        '<uses-feature android:glEsVersion="0x00020000" android:required="true" />',
        '<uses-feature android:name="android.software.webview" android:required="true" />'
    ];

    console.info('replace MainActivity.java');
    const manifestPath = path.join(ctx.androidProjDir,
        `app/src/main/AndroidManifest.xml`);
    let content = readFileSync(manifestPath, 'utf8');
    for (const k of removeStrings) {
        content = content.replace(k, '');
    }

    content = content.replace('<manifest',
        `<manifest xmlns:tools="http://schemas.android.com/tools"
`);

    content = content.replace('<application',
        `${addStrings.join('\n')}
        
<application`);

    content = content.replace('<activity',
        `<activity
            android:screenOrientation="${orientation}"
            tools:ignore="LockedOrientationActivity"
`);

    writeFileSync(manifestPath, content);
}