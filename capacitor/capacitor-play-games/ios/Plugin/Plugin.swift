import Foundation
import Capacitor
import GameKit

class GameCenterControllerDelegate : NSObject, GKGameCenterControllerDelegate {
    // Delegate
      public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
           gameCenterViewController.dismiss(animated: true, completion: nil)
       }
}

@objc(PlayGames)
public class PlayGames: CAPPlugin {

    private var localPlayer = GKLocalPlayer.local
    private var isGameCenterEnabled = false
    private let gameCenterDelegate = GameCenterControllerDelegate()

  public override func load() {

  }

    private func getMainViewController() -> UIViewController? {
        return UIApplication.shared.keyWindow?.rootViewController
    }

    // auth(): Promise<IGoogleSignIn>;
  @objc func auth(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
      // authentification method
        self.localPlayer.authenticateHandler = { [weak self] (gameCenterViewController, error) -> Void in
          // check if there are not error
          if error != nil {
            if error!._code == 2 && error!._domain == "GKErrorDomain" {
                let alert = UIAlertController(title:"Game Center",
                                              message: "If Game Center is disabled try logging in through the Game Center app",
                                              preferredStyle: UIAlertController.Style.alert)

                self?.getMainViewController()?.present(alert, animated: true, completion: nil)
           }
            call.error(error!.localizedDescription)

          } else if gameCenterViewController != nil {
              // 1. Show login if player is not logged in
            self?.getMainViewController()?.present(gameCenterViewController!, animated: true, completion: nil)
          } else if (self?.localPlayer.isAuthenticated ?? false) {
              // 2. Player is already authenticated & logged in, load game center
              self?.isGameCenterEnabled = true
            call.success([
                "login":true,
                "id":self?.localPlayer.playerID ?? "",
                // `alias` matches wanted behavior more than displayName
                "display_name":self?.localPlayer.alias ?? ""
            ])
          } else {
              // 3. Game center is not enabled on the users device
              self?.isGameCenterEnabled = false
            call.error("Local player could not be authenticated")
          }
      }
    }
  }

  // signOut(): Promise<{ login: boolean }>;
  @objc func signOut(_ call: CAPPluginCall) {
    // TODO: not supported
    call.success(["login": localPlayer.isAuthenticated]);
  }

//     signStatus(): Promise<{ login: boolean }>;
@objc func signStatus(_ call: CAPPluginCall) {
    call.success(["login": localPlayer.isAuthenticated])
  }

//     showLeaderboard(leaderboard: { id: string; }): Promise<{ login: boolean }>;
@objc func showLeaderboard(_ call: CAPPluginCall) {
    // TODO:
    call.success()
  }

    // showAllLeaderboard(): void;
    @objc func showAllLeaderboard(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let gcViewController: GKGameCenterViewController = GKGameCenterViewController()
            gcViewController.gameCenterDelegate = self.gameCenterDelegate
             gcViewController.viewState = GKGameCenterViewControllerState.leaderboards
             //gcViewController.leaderboardIdentifier = "yourleaderboardid"
            self.getMainViewController()?.present(gcViewController, animated: true, completion: nil)
        }
        call.success()
    }

//     submitScore(leaderboard: { id: string; points: number; }): void;
@objc func submitScore(_ call: CAPPluginCall) {
    let score = GKScore(leaderboardIdentifier:call.getString("id") ?? "")
    score.leaderboardIdentifier = call.getString("id") ?? ""
    score.value = Int64(call.getInt("points") ?? 0)

    GKScore.report([score]) { (error) in
        // check for errors
        if error != nil {
            call.error("Score update error: \(error!)")
        }
        else {
            call.success()
        }
    }
  }
//     showAchievements(): void;
@objc func showAchievements(_ call: CAPPluginCall) {
    // TODO:
            call.success()
  }
//     unlockAchievement(unlockAchievement: { id: string }): void;
@objc func unlockAchievement(_ call: CAPPluginCall) {
    // TODO:
            call.success()
  }
//     incrementAchievement(incrementAchievement: { id: string, step: number }): void;
@objc func incrementAchievement(_ call: CAPPluginCall) {
    // TODO:
            call.success()
  }
}
