package highduck.capacitor.playgames;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.google.android.gms.auth.api.Auth;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInResult;

@NativePlugin(
        requestCodes = {
                PlayGames.REQUEST_SIGN_IN
        }
)
public class PlayGames extends Plugin {

    static final int REQUEST_SIGN_IN = 10001;

    private PlayGamesUtils playGamesUtils;
    private Achievements achievements;
    private LeaderBoard leaderboard;

    @Override
    public void handleOnStart() {
        achievements = new Achievements(this);
        leaderboard = new LeaderBoard(this);
    }

    @PluginMethod()
    public void auth(final PluginCall call) {

        saveCall(call);
        playGamesUtils = new PlayGamesUtils(this, call);

        // We get the type of login google or google games
        final GoogleSignInOptions signInOptions =
                new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN).build();
        final GoogleSignInAccount account =
                GoogleSignIn.getLastSignedInAccount(this.getBridge().getContext());

        // We check if you have previously logged in
        if (GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray())) {
            // If you have already logged in before, enter here
            playGamesUtils.signInSuccess(account);

        } else {
            // We try to do silent login first
            final GoogleSignInClient signInClient =
                    GoogleSignIn.getClient(this.bridge.getContext(), signInOptions);

            signInClient
                    .silentSignIn()
                    .addOnCompleteListener(
                            (Activity) this.getBridge().getContext(),
                            task -> {
                                if (task.isSuccessful()) {
                                    // Login and save
                                    final GoogleSignInAccount signedInAccount = task.getResult();
                                    // We obtain the client's data and send it
                                    playGamesUtils.signInSuccess(signedInAccount);
                                } else {
                                    // Silent login failed and normal login required
                                    startSignInIntent();
                                }
                            }
                    );
        }
    }

    private void startSignInIntent() {
        final PluginCall saveCall = getSavedCall();
        final GoogleSignInOptions signInOptions =
                new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN).build();
        final GoogleSignInClient signInClient =
                GoogleSignIn.getClient(this.getBridge().getContext(), signInOptions);

        final Intent intent = signInClient.getSignInIntent();
        startActivityForResult(saveCall, intent, REQUEST_SIGN_IN);
    }

    // Event generated when login
    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_SIGN_IN) {
            GoogleSignInResult result = Auth.GoogleSignInApi.getSignInResultFromIntent(data);

            if (result != null) {
                if (result.isSuccess()) {
                    // The signed in account is stored in the result.
                    GoogleSignInAccount signedInAccount = result.getSignInAccount();

                    // We obtain the client's data and send it
                    playGamesUtils.signInSuccess(signedInAccount);

                } else {
                    String message = result.getStatus().getStatusMessage();
                    if (message == null || message.isEmpty()) {
                        message = "Configuration error";
                    }
                    Log.e("PlayGames", message);
                }
            } else {
                Log.e("PlayGames", "null response");
            }
        }
    }

    @PluginMethod()
    public boolean signStatus(final PluginCall call) {

        final GoogleSignInOptions signInOptions =
                new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN).build();
        final GoogleSignInAccount account =
                GoogleSignIn.getLastSignedInAccount(this.getBridge().getContext());

        final boolean status = GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());

        final JSObject info = new JSObject();
        info.put("login", status);
        call.resolve(info);
        return status;
    }

    public boolean signStatusLocal() {
        final GoogleSignInOptions signInOptions =
                new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN).build();
        final GoogleSignInAccount account =
                GoogleSignIn.getLastSignedInAccount(this.getBridge().getContext());
        return GoogleSignIn.hasPermissions(account, signInOptions.getScopeArray());
    }

    @PluginMethod()
    public void signOut(final PluginCall call) {

        final GoogleSignInOptions signInOptions =
                new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN).build();

        final GoogleSignInClient signInClient =
                GoogleSignIn.getClient(this.getBridge().getContext(), signInOptions);

        signInClient.signOut().addOnCompleteListener((Activity) this.getBridge().getContext(),
                task -> {
                    // at this point, the user is signed out.
                    JSObject info = new JSObject();
                    info.put("login", false);

                    call.resolve(info);
                });
    }

    // LeaderBoard
    @PluginMethod()
    public void showAllLeaderboard(final PluginCall call) {
        leaderboard.showAllLeaderBoards(call);
    }

    @PluginMethod()
    public void showLeaderboard(final PluginCall call) {
        leaderboard.showLeaderBoard(call);
    }

    @PluginMethod()
    public void submitScore(final PluginCall call) {
        leaderboard.submitScore(call);
    }

    // Achievement
    @PluginMethod()
    public void showAchievements(final PluginCall call) {
        achievements.showAchievements(call);
    }

    @PluginMethod()
    public void unlockAchievement(final PluginCall call) {
        achievements.unlockAchievement(call);
    }

    @PluginMethod()
    public void incrementAchievement(final PluginCall call) {
        achievements.incrementAchievement(call);
    }

    @Override
    public void startActivityForResult(PluginCall call, Intent intent, int resultCode) {
        super.startActivityForResult(call, intent, resultCode);
    }
}
