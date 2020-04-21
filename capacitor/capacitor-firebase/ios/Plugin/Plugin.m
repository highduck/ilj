#import <Capacitor/Capacitor.h>
#import <Foundation/Foundation.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(Firebase, "Firebase",

    // Analytics
    CAP_PLUGIN_METHOD(enable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(disable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(instance, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(reset, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setUserProp, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setUserID, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setScreen, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(logEvent, CAPPluginReturnPromise);

    // Crashlytics
    CAP_PLUGIN_METHOD(forceCrash, CAPPluginReturnPromise);
)
