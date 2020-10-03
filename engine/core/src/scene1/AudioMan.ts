import {ObservableValue} from "../util/ObservableValue";
import {Howl, Howler as HowlerStatic} from 'howler';

export class AudioMan {

    readonly soundEnabled = new ObservableValue<boolean>(!(localStorage.getItem("sound") === "0"));
    readonly musicEnabled = new ObservableValue<boolean>(!(localStorage.getItem("music") === "0"));
    readonly vibroEnabled = new ObservableValue<boolean>(!(localStorage.getItem("vibro") === "0"));

    musicVolume = 1;
    soundVolume = 1;

    music: Howl | undefined = undefined;

    private _muteGlobal: boolean = false;
    private _muteLockers: number = 0;

    readonly _map = new Map<string, string>();

    constructor() {
        HowlerStatic.autoSuspend = false;
        HowlerStatic.autoUnlock = true;

        this.soundEnabled.changed.on((enabled) =>
            localStorage.setItem("sound", enabled ? "1" : "0")
        );

        this.musicEnabled.changed.on((enabled) => {
            localStorage.setItem("music", enabled ? "1" : "0");
            if (this.music !== undefined) {
                this.music.volume(this.currentMusicVolume);
            }
        });

        this.vibroEnabled.changed.on((enabled) =>
            localStorage.setItem("vibro", enabled ? "1" : "0")
        );
    }

    controlMusic(volume = 1, pitch = 1) {
        if (this.music !== undefined) {
            this.musicVolume = volume;
            this.music.rate(pitch);
            this.music.volume(this.currentMusicVolume);
        }
    }

    get currentMusicVolume() {
        return this.musicVolume * (this.musicEnabled.value ? 1 : 0);
    }

    get currentSoundVolume() {
        return this.soundVolume * (this.soundEnabled.value ? 1 : 0);
    }

    playMusic(id: string) {
        if (this.music !== undefined) {
            this.music.stop();
            this.music = undefined;
        }
        const src = this._map.get(id);
        if (src !== undefined) {
            this.music = new Howl({
                src, loop: true, volume: this.currentMusicVolume
            });
            this.music.play();
        }
    }

    playSound(id: string, pitch?: number, volume?: number) {
        if (this.soundEnabled.value) {
            const src = this._map.get(id);
            if (src) {
                new Howl({
                    src, rate: pitch, volume: this.currentSoundVolume * (volume ?? 1),
                }).play();
            }
        }
    }

    preload(url: string, id: string) {
        this._map.set(id, url);
        new Howl({
            src: url
        });
    }

    muteGlobal(enabled: boolean) {
        this._muteGlobal = enabled;
        this.updateMute();
    }

    beginMute() {
        ++this._muteLockers;
        this.updateMute();
    }

    endMute() {
        --this._muteLockers;
        this.updateMute();
    }

    vibrate(duration: number) {
        // TODO:
    }

    private updateMute() {
        HowlerStatic.mute(this._muteLockers > 0 || this._muteGlobal);
    }
}