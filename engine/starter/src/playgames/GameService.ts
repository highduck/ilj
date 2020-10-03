import {Capacitor, Plugins} from "@capacitor/core";
import {PlayGamesPlugin} from "@highduck/capacitor-play-games";

export class GameService {

    readonly plugin: PlayGamesPlugin;
    enabled = false;

    constructor() {
        this.enabled = Capacitor.isPluginAvailable("PlayGames");
        this.plugin = Plugins.PlayGames as PlayGamesPlugin;
    }

    async auth() {
        if (!this.enabled) {
            return;
        }
        
        await this.plugin.auth();
    }

    async ui(type?: string, id?: string) {
        if (!this.enabled) {
            return;
        }

        let status = await this.plugin.signStatus();
        if (!status.login) {
            status = await this.plugin.auth();
        }
        if (status.login) {
            if (type === 'leaderboard') {
                if (!id) {
                    this.plugin.showAllLeaderboard();
                } else {
                    this.plugin.showLeaderboard({id});
                }
            } else if (type === 'achievements') {
                this.plugin.showAchievements();
            }
        }
    }

    async submitScore(id: string, points: number) {
        if (!this.enabled) {
            return;
        }

        const status = await this.plugin.signStatus();
        if (status.login) {
            await this.plugin.submitScore({id, points});
        }
    }
}

