// @ts-ignore
declare module '@capacitor/core' {
    interface PluginRegistry {
        Billing: BillingProtocol;
    }
}

export interface PurchaseOptions {
    sku: string;
    subscribe?: boolean;
}

export const enum PurchaseState {
    UNSPECIFIED_STATE = 0,
    PURCHASED = 1,
    PENDING = 2
}

export interface PurchaseResult {
    orderId: string;
    packageName: string;
    productId: string;
    purchaseTime: number;
    purchaseState: number; /* PurchaseState */
    purchaseToken: string;
    signature: string;
    type: string;
    receipt: string;
}

export interface ConsumePurchaseOptions {
    type: string;
    receipt: string;
    signature: string;
}

export interface ConsumePurchaseResult {
    transactionId: string;
    productId: string;
    token: string;
}

export interface SkuDetailsOptions {
    skus: string[]
}

export interface SkuDetails {
    productId: string;
    title: string;
    description: string;
    price: string;
    priceAsDecimal?: number; // only ios
    type: string;
}

export interface SkuDetailsResult {
    list: SkuDetails[];

    // for ios could be invalid list
    // invalidProductsIds: string[]
}

export interface RestorePurchasesResult {
    purchases: PurchaseResult[];
}

export interface BillingProtocol {
    initialize(): Promise<void>;

    purchase(options: PurchaseOptions): Promise<PurchaseResult>;

    consumePurchase(options: ConsumePurchaseOptions): Promise<ConsumePurchaseResult>;

    getSkuDetails(options: SkuDetailsOptions): Promise<SkuDetailsResult>;

    restorePurchases(): Promise<RestorePurchasesResult>;
}