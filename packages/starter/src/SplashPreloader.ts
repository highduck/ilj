export class SplashPreloader {
    infoDiv: HTMLElement | null = null;
    div: HTMLElement | null = null;

    constructor() {
        if (process.env.PLATFORM !== 'web') {
            try {
                (window as any)["Capacitor"]["Plugins"]["SplashScreen"]["hide"]({
                    fadeOutDuration: 0
                });
            } catch {
            }
        }

        this.div = document.getElementById('loader');
        this.infoDiv = document.getElementById('loader_info');
    }

    setInfo(text: string) {
        if (this.infoDiv) {
            this.infoDiv.innerText = text;
        }
    }

    dispose() {
        this.div?.remove();
    }
}
