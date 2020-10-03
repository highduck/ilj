#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(PlayGames, "PlayGames",
    CAP_PLUGIN_METHOD(auth, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(signOut, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(signStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(showLeaderboard, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(showAllLeaderboard, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(submitScore, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(showAchievements, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(unlockAchievement, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(incrementAchievement, CAPPluginReturnPromise);
)