import {Plugins} from '@capacitor/core';
import {FirebaseProtocol, LogEventParams, ScreenParams, UserIDParams, UserPropParams} from './definitions';

export class Firebase implements FirebaseProtocol {

    readonly impl = Plugins.FirebasePlugin as FirebaseProtocol;

    enable(): Promise<void> {
        return this.impl.enable();
    }

    disable(): Promise<void> {
        return this.impl.disable();
    }

    instance(): Promise<{ id: string }> {
        return this.impl.instance();
    }

    reset(): Promise<void> {
        return this.impl.reset();
    }

    setScreen(options: ScreenParams): Promise<void> {
        return this.impl.setScreen(options);
    }

    setUserID(options: UserIDParams): Promise<void> {
        return this.impl.setUserID(options);
    }

    setUserProp(options: UserPropParams): Promise<void> {
        return this.impl.setUserProp(options);
    }

    logEvent(options: LogEventParams): Promise<void> {
        return this.impl.logEvent(options);
    }

    // crashlytics
    forceCrash(): Promise<void> {
        return this.impl.forceCrash();
    }
}
