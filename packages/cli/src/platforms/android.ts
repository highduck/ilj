import console from "../common/log";
import {copyFile} from "../common/utility";
import {cap} from "../bins/cap";

// dir == approot
export function syncAndroidProject(dir: string) {

    console.info("sync android project...");
    cap('sync', 'android');
    try {
        copyFile('google-services.json', 'android/app/google-services.json');
    } catch {
        console.warn('please check google-services.json');
    }

    // console.info("patch android project...");
    // const dict: any = {};
    // dict[`apply from: "../capacitor-cordova-android-plugins/cordova.variables.gradle"`] = '';
    //
    // replace_in_file("android/app/capacitor.build.gradle", dict);
    //
    // const capacitorAndroidPath = getPackagePath('@capacitor/android', dir);
    // const capacitorBuildGradlePath = path.join(capacitorAndroidPath, 'capacitor', 'build.gradle');
    // replace_in_file(capacitorBuildGradlePath, {
    //     "com.android.tools.build:gradle:3.3.2": "com.android.tools.build:gradle:3.6.1",
    //
    //     "compileSdkVersion 28": "compileSdkVersion 29",
    //     "targetSdkVersion 28": "targetSdkVersion 29",
    //
    //     "com.android.support:appcompat-v7:28.0.0": "androidx.appcompat:appcompat:1.2.0-alpha02",
    //     "com.android.support:support-compat:28.0.0": "androidx.core:core:1.2.0",
    //     "com.android.support:design:28.0.0": "com.google.android.material:material:1.1.0",
    //     "com.android.support:customtabs:28.0.0": "androidx.browser:browser:1.2.0",
    //     "com.google.firebase:firebase-messaging:18.0.0": "com.google.firebase:firebase-messaging:20.1.2",
    //     "junit:junit:4.12": "junit:junit:4.13",
    //
    //     "implementation 'com.google.android.gms:play-services-location:16.0.0'": '',
    //     // "implementation 'org.apache.cordova:framework:7.0.0'": ''
    // });

    cap('open', 'android');
}