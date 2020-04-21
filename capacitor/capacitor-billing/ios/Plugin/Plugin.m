#import <Capacitor/Capacitor.h>

CAP_PLUGIN(Billing, "Billing",
    CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(purchase, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(consumePurchase, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getSkuDetails, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(restorePurchases, CAPPluginReturnPromise);
)
