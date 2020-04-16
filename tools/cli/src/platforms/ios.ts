import {copy_file} from "../common/utility";
import {cap} from "../bins/cap";
import console from "../common/log";

export function syncIOSProject(dir: string) {
    console.info('sync ios project...');
    cap('sync', 'ios');
    try {
        copy_file('GoogleService-Info.plist', 'ios/App/App/GoogleService-Info.plist');
    } catch {
        console.warn('check GoogleService-Info.plist in project root');
    }
    cap('open', 'ios');
}