package highduck.capacitor.playgames;

import android.app.Activity;
import android.net.Uri;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.games.Games;
import com.google.android.gms.games.Player;
import com.google.android.gms.games.PlayersClient;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

public class PlayGamesUtils {
    private PlayersClient mPlayersClient;
    private PluginCall call;
    private Activity activity_plugin;

    private PlayGames plugin;

    public PlayGamesUtils(PlayGames plugin, PluginCall call) {
        this.plugin = plugin;
        this.call = call;
        activity_plugin = (Activity) plugin.getBridge().getContext();
    }

    // It will help us return the signIn when it is complete
    public void signInSuccess(final GoogleSignInAccount signedInAccount) {
        mPlayersClient = Games.getPlayersClient(activity_plugin, signedInAccount);

        mPlayersClient.getCurrentPlayer()
                .addOnCompleteListener(task -> {
                    String displayName = "UserName";
                    String id = "id";
                    Uri icon = null;
                    String title = "title";

                    if (task.isSuccessful()) {
                        final Player player = task.getResult();
                        if (player != null) {
                            id = player.getPlayerId();
                            displayName = player.getDisplayName();
                            icon = player.getIconImageUri();
                            title = player.getTitle();
                        }
                    }
                    //else {
                    //Exception e = task.getException();
                    //}

                    Games.getGamesClient(activity_plugin, signedInAccount).setViewForPopups(
                            activity_plugin.getWindow().getDecorView().findViewById(android.R.id.content)
                    );

                    JSObject info = new JSObject();

                    info.put("id", id);
                    info.put("display_name", displayName);
                    info.put("icon", icon);
                    info.put("title", title);
                    info.put("login", true);

                    call.resolve(info);
                });
    }
}
