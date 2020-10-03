import {BillingProtocol, PurchaseResult} from "@highduck/capacitor-billing";
import {Capacitor, Plugins} from "@capacitor/core";
import {Signal} from "@highduck/core";

export class Purchasing {
    readonly enabled: boolean;
    readonly plugin: BillingProtocol;
    readonly connection: Promise<BillingProtocol | null>;
    readonly restored = new Signal<PurchaseResult[]>();

    constructor() {
        this.plugin = Plugins.Billing as BillingProtocol;
        this.enabled = Capacitor.isPluginAvailable('Billing');
        this.connection = this.createConnection();
    }

    async restorePurchases() {
        if (this.enabled) {
            const plugin = await this.createConnection();
            if (plugin) {
                const result = await plugin.restorePurchases();
                this.restored.emit(result.purchases);
            }
        }
    }

    private async createConnection(): Promise<BillingProtocol | null> {
        if (this.enabled) {
            try {
                await this.plugin.initialize();
                return this.plugin;
            } catch {
            }
        }
        return null;
    }
}