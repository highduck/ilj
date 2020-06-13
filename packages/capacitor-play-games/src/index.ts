export interface AuthInfo {
    login: boolean;
    id?: string;
    display_name?: string;

    // not ios
    icon?: string;
    // not ios
    title?: string;
}

export interface PlayGamesPlugin {
    auth(): Promise<AuthInfo>;

    signOut(): Promise<{ login: boolean }>;

    signStatus(): Promise<{ login: boolean }>;

    showLeaderboard(leaderboard: { id: string; }): Promise<{ login: boolean }>;

    showAllLeaderboard(): void;

    submitScore(leaderboard: { id: string; points: number; }): void;

    showAchievements(): void;

    unlockAchievement(unlockAchievement: { id: string }): void;

    incrementAchievement(incrementAchievement: { id: string, step: number }): void;
}

declare global {
    interface PluginRegistry {
        PlayGames: PlayGamesPlugin;
    }
}