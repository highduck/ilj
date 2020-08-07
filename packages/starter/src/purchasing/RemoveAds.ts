import {Purchasing} from "./Purchasing";
import {AdsController} from "../ads/AdsController";
import {PurchaseResult, PurchaseState, SkuDetails} from "@highduck/capacitor-billing";
import {Plugins} from "@capacitor/core";
import {ObservableValue} from "@highduck/core";

const {Storage} = Plugins;

// TODO: somehow secure that!
const PREMIUM_ID = 'remove_ads';
const PREMIUM_CODE = 'xyzzyx';

export class RemoveAds {

    readonly enabled: boolean;

    readonly purchased: ObservableValue<boolean>;

    static async createAsync(purchasing: Purchasing,
                             ads: AdsController,
                             productID: string = 'remove_ads') {
        const data = await Storage.get({key: PREMIUM_ID});
        const purchased = data.value === PREMIUM_CODE;
        return new RemoveAds(purchasing, ads, productID, purchased);
    }

    constructor(readonly purchasing: Purchasing,
                readonly ads: AdsController,
                readonly productID: string = 'remove_ads',
                purchased: boolean) {

        this.enabled = purchasing.enabled && ads.isAvailable;
        this.purchased = new ObservableValue(purchased);
        if (purchased) {
            this.disableAds();
        }
        this.purchasing.restored.on((restoredPurchased) => {
            for (let i = 0; i < restoredPurchased.length; ++i) {
                this.processPurchase(restoredPurchased[i]);
            }
        });
    }

    private processPurchase(purchase?: PurchaseResult) {
        // remove ads for all purchases :)
        // if (purchase.productId === this.productID) {
        // TODO: check restore
        if (purchase && purchase.purchaseState !== PurchaseState.PURCHASED) {
            console.warn("purchase state is not PURCHASED: " + purchase.purchaseState);
        }
        Storage.set({key: PREMIUM_ID, value: PREMIUM_CODE}).then();
        this.purchased.value = true;
        this.disableAds();
        // }
    }

    private disableAds() {
        this.ads.remove(true);
    }

    async buy() {
        const plugin = await this.purchasing.connection;
        if (!plugin) {
            return;
        }

        let success = false;
        try {
            const result = await plugin.purchase({
                sku: "remove_ads",
                subscribe: false
            });
            console.info("purchase state: " + result.purchaseState);
            success = result.purchaseState === PurchaseState.PURCHASED;
            success = true;
        } catch (err) {
            if (err) {
                const BILLING_RESPONSE_RESULT_ITEM_ALREADY_OWNED = '7';
                const IABHELPER_USER_CANCELLED = '-1005';
                if (err.code === BILLING_RESPONSE_RESULT_ITEM_ALREADY_OWNED) {
                    success = true;
                } else if (err.code === IABHELPER_USER_CANCELLED) {
                } else {
                    alert(`Remove Ads\n\n${err}`);
                }
            }
        }

        if (!success) {
            // TODO: it's fake for development WEB
            success = process.env.PLATFORM === 'web' &&
                process.env.NODE_ENV === 'development';
        }

        if (success) {
            this.processPurchase();
        }
    }

    async getProductDetails(): Promise<SkuDetails | null> {
        const plugin = await this.purchasing.connection;
        if (plugin) {
            const details = await plugin.getSkuDetails({skus: [this.productID]});
            return details.list[0];
        }
        return null;
    }

    /** ONLY FOR DEVELOPMENT **/
    clear() {
        Storage.remove({key: PREMIUM_ID}).then();
        this.purchased.value = false;
    }
}