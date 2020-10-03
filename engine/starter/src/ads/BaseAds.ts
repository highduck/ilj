import {ObservableValue} from "@highduck/core";

export const enum AdBannerMode {
    Disabled,
    Bottom,
    Top
}

export interface AdUnits {
    banner?: string;
    interstitial?: string;
    rewarded?: string;
}

export interface BaseAds {
    readonly isAvailable: boolean;
    readonly rewardVideoReady: ObservableValue<boolean>;
    readonly interstitialLoaded: boolean;

    loadVideoReward(): Promise<void>;

    loadInterstitial(): Promise<void>;

    playVideoReward(): Promise<void>;

    playInterstitial(): Promise<void>;

    setBanner(mode: AdBannerMode): Promise<void>;

}