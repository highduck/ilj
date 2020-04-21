package highduck.capacitor.playgames;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.PluginCall;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.games.Games;

class Achievements {

    private static final int RC_ACHIEVEMENT_UI = 9003;

    private PlayGames plugin;

    Achievements(PlayGames Plugin) {
        plugin = Plugin;
    }

    void showAchievements(final PluginCall call) {
        final Activity activity = (Activity) plugin.getBridge().getContext();
        final GoogleSignInOptions signInOptions = GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN;
        final GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
        final boolean status = GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());

        if (status) {
            Games.getAchievementsClient(activity, account)
                    .getAchievementsIntent()
                    .addOnSuccessListener(
                            intent -> plugin.startActivityForResult(call, intent, RC_ACHIEVEMENT_UI)
                    );
        }
    }

    void unlockAchievement(final PluginCall call) {
        final Activity activity = (Activity) plugin.getBridge().getContext();
        final GoogleSignInOptions signInOptions = GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN;
        final GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
        final boolean status = GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());
        final String id = call.getString("id");

        if (status) {
            if (id != null) {
                activity.runOnUiThread(
                        () -> Games.getAchievementsClient(activity, account).unlock(id)
                );
            } else {
                Log.w("WARNING", "The provider achievements id is required");
                call.reject("The provider achievements id is required");
            }
        }
    }

    void incrementAchievement(final PluginCall call) {
        final Activity activity = (Activity) plugin.getBridge().getContext();
        final GoogleSignInOptions signInOptions = GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN;
        final GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
        final boolean status = GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());
        final String id = call.getString("id");
        final Integer step = call.getInt("step", 1);

        if (status) {
            if (id != null) {
                activity.runOnUiThread(
                        () -> Games.getAchievementsClient(activity, account).increment(id, step)
                );
            } else {
                Log.w("WARNING", "The provider achievements id is required");
                call.reject("The provider achievements id is required");
            }
        }
    }
}