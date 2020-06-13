import {BillingProtocol} from "./definition";

export * from './definition';

let instance: BillingProtocol | undefined = undefined;

export async function getBilling(): Promise<BillingProtocol> {
    if (instance) {
        return instance;
    }
    try {
        const billing = require('@capacitor/core').Plugins.Billing as BillingProtocol;
        if (billing) {
            await billing.initialize();
            instance = billing;
            console.log("Billing init OK");
        }
    } catch (err) {
        console.log("Billing unavailable");
        console.warn(err);
    }
    return instance;
}