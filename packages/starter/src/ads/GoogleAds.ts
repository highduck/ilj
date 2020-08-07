import {AdMobPlugin, AdPosition} from "@highduck/capacitor-admob";
import {delay, ObservableValue} from "@highduck/core";
import {Capacitor, PluginListenerHandle, Plugins} from "@capacitor/core";
import {AdBannerMode, AdUnits, BaseAds} from "./BaseAds";

export class GoogleAds implements BaseAds {
    admob: AdMobPlugin;
    isAvailable: boolean;

    readonly rewardVideoReady = new ObservableValue(false);
    rewardVideoLoading = false;

    interstitialLoading = false;
    interstitialLoaded = false;

    bannerMode = AdBannerMode.Disabled;

    constructor(
        readonly units: AdUnits
    ) {
        this.isAvailable = Capacitor.isPluginAvailable("AdMob");
        this.admob = Plugins.AdMob as AdMobPlugin;
    }

    async setBanner(mode: AdBannerMode) {
        if (this.isAvailable && this.units.banner && this.bannerMode !== mode) {
            if (this.bannerMode !== AdBannerMode.Disabled) {
                await this.admob.removeBanner();
            }
            this.bannerMode = mode;
            if (this.bannerMode !== AdBannerMode.Disabled) {
                const position = this.bannerMode === AdBannerMode.Bottom ? AdPosition.BOTTOM_CENTER : AdPosition.TOP_CENTER;
                await this.admob.showBanner({
                    adId: this.units.banner,
                    position,
                    autoShow: false
                });
            }
        }
    }

    async loadVideoReward() {
        if (!this.units.rewarded) {
            return;
        }

        if (this.rewardVideoLoading || this.rewardVideoReady.value) {
            return;
        }

        this.rewardVideoLoading = true;
        let isLoaded = false;
        while (!isLoaded) {
            try {
                await this._prepareRewardVideo(this.units.rewarded);
                isLoaded = true;
            } catch (e) {
                console.warn(e);
                await delay(5000);
            }
        }

        this.rewardVideoLoading = false;
        this.rewardVideoReady.value = true;
    }

    async playVideoReward(): Promise<void> {
        let rewarded = false;
        if (this.rewardVideoReady.value && !this.rewardVideoLoading) {
            try {
                await this._showRewardVideo();
                rewarded = true;
            } catch {
            }
            this.rewardVideoReady.value = false;
            //this.loadRewardVideo();
        }
        if (!rewarded) {
            throw new Error();
        }
    }

    private async _prepareRewardVideo(id: string): Promise<void> {
        let handles: PluginListenerHandle[] = [];
        await new Promise((resolve, reject) => {
            handles.push(this.admob.addListener("onRewardedVideoAdLoaded", (_) => {
                resolve();
            }));
            handles.push(this.admob.addListener("onRewardedVideoAdFailedToLoad", (v) => {
                reject("admob error: " + v.error);
            }));
            this.admob.prepareRewardVideoAd({
                adId: id
            });
        });
        for (const handle of handles) {
            handle.remove();
        }
    }

    private async _showRewardVideo(): Promise<void> {
        let handles: PluginListenerHandle[] = [];
        let rewarded = false;
        await new Promise((resolve) => {
            handles.push(this.admob.addListener("onRewarded", (_) => {
                console.debug("[ads] onRewarded");
                rewarded = true;
            }));
            handles.push(this.admob.addListener("onRewardedVideoAdClosed", (_) => {
                console.debug("[ads] onRewardedVideoAdClosed");
                delay(100).then(resolve);
            }));
            this.admob.showRewardVideoAd();
        });
        for (const handle of handles) {
            handle.remove();
        }

        if (!rewarded) {
            throw new Error();
        }
    }

    async loadInterstitial() {
        if (!this.units.interstitial) {
            return;
        }
        if (this.interstitialLoading || this.interstitialLoaded) {
            return;
        }

        this.interstitialLoading = true;

        let isLoaded = false;
        while (!isLoaded) {
            try {
                await this._prepareInterstitial(this.units.interstitial);
                isLoaded = true;
            } catch (e) {
                console.warn(e);
                await delay(5000);
            }
        }

        this.interstitialLoading = false;
        this.interstitialLoaded = true;
    }

    async playInterstitial(): Promise<void> {
        if (!this.interstitialLoaded || this.interstitialLoading) {
            return;
        }

        try {
            await this._showInterstitial();
        } catch {
        }
        this.interstitialLoaded = false;
        this.loadInterstitial();
    }

    private async _prepareInterstitial(id: string): Promise<void> {
        let handles: PluginListenerHandle[] = [];
        await new Promise((resolve, reject) => {
            handles.push(this.admob.addListener("onAdLoaded", (_) => {
                resolve();
            }));
            handles.push(this.admob.addListener("onAdFailedToLoad", (v) => {
                reject("admob error: " + v.error);
            }));
            this.admob.prepareInterstitial({
                adId: id
            });
        });
        for (const handle of handles) {
            handle.remove();
        }
    }

    private async _showInterstitial(): Promise<void> {
        let handles: PluginListenerHandle[] = [];
        await new Promise((resolve) => {
            handles.push(this.admob.addListener("onAdClosed", (_) => {
                resolve();
            }));
            this.admob.showInterstitial();
        });
        for (const handle of handles) {
            handle.remove();
        }
    }
}