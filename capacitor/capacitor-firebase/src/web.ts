import {registerWebPlugin, WebPlugin} from '@capacitor/core';
import {FirebaseProtocol, LogEventParams, ScreenParams, UserIDParams, UserPropParams} from './definitions';
import appConfig from '@AppConfig';

import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/performance';

class FirebasePluginWeb extends WebPlugin implements FirebaseProtocol {

    constructor() {
        super({
            name: 'Firebase',
            platforms: ['web']
        });

        console.info("FirebasePluginWeb init");
        const firebaseConfig = appConfig.firebase;

        firebase.initializeApp(firebaseConfig);
        firebase.analytics();
        firebase.performance();
    }

    async disable(): Promise<void> {
        firebase.analytics().setAnalyticsCollectionEnabled(false);
    }

    async enable(): Promise<void> {
        firebase.analytics().setAnalyticsCollectionEnabled(true);
    }

    async instance(): Promise<{ id: string }> {
        // TODO: config.appId ? or Installation id?
        return {id: "0"};
    }

    async logEvent(options: LogEventParams): Promise<void> {
        firebase.analytics().logEvent(options.name, options.params);
    }

    async reset(): Promise<void> {
        // TODO:
    }

    async setScreen(options: ScreenParams): Promise<void> {
        firebase.analytics().setCurrentScreen(options.name);
    }

    async setUserID(options: UserIDParams): Promise<void> {
        firebase.analytics().setUserId(options.value);
    }

    async setUserProp(options: UserPropParams): Promise<void> {
        firebase.analytics().setUserProperties({
            [options.key]: options.value
        });
    }

    async forceCrash() {
        throw Error("TODO: Force Crash for web");
    }
}

const FirebasePlugin = new FirebasePluginWeb();
export {FirebasePlugin};

registerWebPlugin(FirebasePlugin);
