package highduck.capacitor.playgames;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.PluginCall;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.games.Games;

class LeaderBoard {

    private static final int RC_LEADERBOARD_UI = 9004;

    private PlayGames plugin;

    LeaderBoard(PlayGames Plugin) {
        plugin = Plugin;
    }

    void showAllLeaderBoards(final PluginCall call) {
        final Activity activity = (Activity) plugin.getBridge().getContext();
        final GoogleSignInOptions signInOptions = GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN;
        final GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
        final boolean status = GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());

        if (status) {
            Games.getLeaderboardsClient(activity, account)
                    .getAllLeaderboardsIntent()
                    .addOnSuccessListener(
                            intent -> plugin.startActivityForResult(call, intent, RC_LEADERBOARD_UI)
                    );
        }
    }

    void showLeaderBoard(final PluginCall call) {
        final Activity activity = (Activity) plugin.getBridge().getContext();
        final GoogleSignInOptions signInOptions = GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN;
        final GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
        final boolean status = GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());
        final String id = call.getString("id");
        if (status) {
            if (id != null) {
                Games.getLeaderboardsClient(activity, account)
                        .getLeaderboardIntent(id)
                        .addOnSuccessListener(intent ->
                                plugin.startActivityForResult(call, intent, RC_LEADERBOARD_UI));
            } else {
                Log.w("WARNING", "The provider leaderboard id is required");
                call.reject("The provider leaderboard id is required");
            }
        }
    }

    public void submitScore(final PluginCall call) {
        final String id = call.getString("id");
        final int points = call.getInt("points", 0);
        final Activity activity = (Activity) plugin.getBridge().getContext();
        final GoogleSignInOptions signInOptions = GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN;
        final GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(activity);
        final boolean status = GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());

        if (status) {
            if (id != null) {
                Games.getLeaderboardsClient(activity, account).submitScore(id, points);
            } else {
                Log.w("WARNING", "The provider leaderboard id is required");
                call.reject("The provider id is required");
            }
        }
    }
}