import {awaitDocument} from "@highduck/core";
import {Engine} from "@highduck/core";
import {startMain} from "./game/Game";
import {Plugins} from '@capacitor/core';

awaitDocument().then(() => {

    Plugins.SplashScreen.hide().then();

    if(!Engine.restore()) {
        const engine = new Engine({
            width: 768,
            height: 1024
        });
            startMain(engine);
        engine.start();
    }

    if(process.env.NODE_ENV === 'development') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('dev')) {
            const {DevApp} = require("@highduck/live-inspector");
            const engine = Engine.current;
            try {
                DevApp.CURRENT = engine.resolve(DevApp);
                DevApp.init();
            } catch {
                engine.register(new DevApp(engine));
            }

            Plugins.Device.getInfo().then((info) => {
                console.log(info);
            });
        }
    }
});
