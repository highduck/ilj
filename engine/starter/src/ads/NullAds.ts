import {ObservableValue} from "@highduck/core";
import {AdBannerMode, BaseAds} from "./BaseAds";

export class NullAds implements BaseAds {

    readonly isAvailable = false;
    readonly rewardVideoReady = new ObservableValue(false);
    readonly interstitialLoaded = false;

    async loadVideoReward() {
    }

    async loadInterstitial() {
    }

    async playVideoReward() {
    }

    async playInterstitial() {
    }

    async setBanner(mode: AdBannerMode) {
    }
}