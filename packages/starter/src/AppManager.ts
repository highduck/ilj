import '@highduck/capacitor-firebase';
import {AppState, Plugins} from '@capacitor/core';
import {Engine} from "@highduck/core";
import {FirebaseProtocol} from "@highduck/capacitor-firebase";

const {App} = Plugins;

function onBackButton() {
    const engine = Engine.current;
    if (engine) {
        engine.interactiveManager.sendBackButton();
    }
}

function onAppStateChanged(state: AppState) {
    const engine = Engine.current;
    if (engine) {
        engine.audio.muteGlobal(!state.isActive);
        if (!state.isActive) {
            engine.interactiveManager.handleSystemPause();
        }
    }
}

export class AppManager {

    readonly firebase = Plugins.Firebase as FirebaseProtocol;

    constructor() {
        App.addListener("appStateChange", onAppStateChanged);
        App.addListener("backButton", onBackButton);
    }

    exit() {
        if (process.env.PLATFORM !== 'web') {
            // not dispose, just stop main loop
            Engine.current.dispose();
            // we have to complete frame
            setTimeout(() => App.exitApp(), 16);
        }
    }
}