export class SplashPreloader {
    infoDiv: HTMLElement | null = null;
    div: HTMLElement | null = null;

    constructor() {
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
        // TODO: check if needed
        // Plugins.SplashScreen.hide({
        //     fadeOutDuration: 0
        // }).then();
    }
}
