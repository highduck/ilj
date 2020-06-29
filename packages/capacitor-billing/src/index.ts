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
            console.log("Billing init OK");
            instance = billing;
            return billing;
        }
    } catch (err) {
        console.log("Billing unavailable");
        console.warn(err);
    }
    throw 'error';
}