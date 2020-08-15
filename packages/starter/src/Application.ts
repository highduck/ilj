import {awaitDocument, Engine, loadBundle} from "@highduck/core";
import {SplashPreloader} from "./SplashPreloader";
import {LocaleManager} from "./LocaleManager";
import {AppManager} from "./AppManager";
import {AdsController, AdsControllerConfig} from "./ads/AdsController";
import {GameService} from "./playgames/GameService";
import {Purchasing} from "./purchasing/Purchasing";
import {RemoveAds} from "./purchasing/RemoveAds";

export interface ViewConfig {
    width: number;
    height: number;
}

export interface BootEvents {
    preload: () => Promise<unknown>;
    create: () => Promise<unknown>;
}

export interface DevConfig {
    mute?: boolean;
    record?: boolean;
}

export interface RemoveAdsConfig {
    productID?: string
}

export interface ApplicationConfig {
    view: ViewConfig;
    boot: BootEvents;
    ads: AdsControllerConfig;
    dev?: DevConfig;
    removeAds?: RemoveAdsConfig;
}

export class Application {

    static current: Application;

    private constructor(
        readonly config: ApplicationConfig,
        readonly locale: LocaleManager,
        readonly app: AppManager,
        readonly ads: AdsController,
        readonly gameService: GameService,
        readonly purchasing: Purchasing,
        readonly removeAds: RemoveAds
    ) {
    }

    static async createAsync(config: ApplicationConfig) {
        const app = new AppManager();
        const ads = new AdsController(config.ads);
        const gameService = new GameService();
        const purchasing = new Purchasing();

        const [locale, removeAds] = await Promise.all([
            LocaleManager.createAsync('en', 'assets/settings/strings.json'),
            RemoveAds.createAsync(purchasing, ads, config.removeAds?.productID)
        ]);

        Application.current = new Application(
            config,
            locale,
            app,
            ads,
            gameService,
            purchasing,
            removeAds
        );
    }
}

export async function bootGame(config: ApplicationConfig) {
    const splash = new SplashPreloader();
    splash.setInfo('Loading Assets...');
    await awaitDocument();

    new Engine(config.view);
    if (process.env.NODE_ENV === 'development') {
        import('@highduck/live-inspector').then();
    }

    await Promise.all([
        Application.createAsync(config),
        loadBundle('assets'),
        config.boot.preload()
    ]);

    splash.setInfo('Start...');
    await config.boot.create();
    splash.dispose();

    if (process.env.NODE_ENV === 'development') {
        if (config.dev?.mute) {
            Engine.current.audio.beginMute();
        }
        if (config.dev?.record) {
            //startScreenShots(Engine.current.view.canvas);
        }
    }
}
