import {WebPlugin} from '@capacitor/core';
import {FirebaseProtocol, LogEventParams, ScreenParams, UserIDParams, UserPropParams} from './definitions';
import appConfig from '@AppConfig';

import * as firebase from 'firebase/app';
import 'firebase/analytics';

// import 'firebase/performance';

async function checkAnalyticsSupported() {
    try {
        const supported = await firebase.analytics.isSupported();
        if (!supported) {
            console.warn('firebase analytics web is not supported');
        }
        return supported;
    } catch (e) {
        console.error('firebase analytics web error:', e);
        return false;
    }
}

class FirebasePluginWeb extends WebPlugin implements FirebaseProtocol {

    analyticsSupported: Promise<boolean>;

    constructor() {
        super({
            name: 'Firebase',
            platforms: ['web']
        });

        console.info("FirebasePluginWeb init");
        try {
            const firebaseConfig = appConfig.firebase;
            firebase.initializeApp(firebaseConfig);
        } catch (e) {
            console.error('firebase.initializeApp error:', e);
        }
        this.analyticsSupported = checkAnalyticsSupported();
    }

    async disable(): Promise<void> {
        if (await this.analyticsSupported) {
            firebase.analytics().setAnalyticsCollectionEnabled(false);
        }
    }

    async enable(): Promise<void> {
        if (await this.analyticsSupported) {
            firebase.analytics().setAnalyticsCollectionEnabled(true);
        }
    }

    async instance(): Promise<{ id: string }> {
        // TODO: config.appId ? or Installation id?
        return {id: "0"};
    }

    async logEvent(options: LogEventParams): Promise<void> {
        if (await this.analyticsSupported) {
            firebase.analytics().logEvent(options.name, options.params);
        }
    }

    async reset(): Promise<void> {
        // TODO:
    }

    async setScreen(options: ScreenParams): Promise<void> {
        if (await this.analyticsSupported) {
            firebase.analytics().setCurrentScreen(options.name);
        }
    }

    async setUserID(options: UserIDParams): Promise<void> {
        if (await this.analyticsSupported) {
            firebase.analytics().setUserId(options.value);
        }
    }

    async setUserProp(options: UserPropParams): Promise<void> {
        if (await this.analyticsSupported) {
            firebase.analytics().setUserProperties({
                [options.key]: options.value
            });
        }
    }

    async forceCrash() {
        throw Error("TODO: Force Crash for web");
    }
}

const FirebasePlugin = new FirebasePluginWeb();
export {FirebasePlugin};

import {registerWebPlugin} from '@capacitor/core';
registerWebPlugin(FirebasePlugin);
