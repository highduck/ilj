import {syncIOSProject} from "./ios";
import {syncAndroidProject} from "./android";
import console from "../common/log";

export function syncPlatformProject(platform: string, dir: string) {
    const prevDir = process.cwd();
    try {
        process.chdir(dir);
        switch (platform) {
            case 'android':
                syncAndroidProject(dir);
                break;
            case 'ios':
                syncIOSProject(dir);
                break;
        }
    } catch (err) {
        console.error(err);
    }
    process.chdir(prevDir);
}