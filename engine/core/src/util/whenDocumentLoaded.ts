import {delay} from "./delay";

export async function whenDocumentLoaded(): Promise<void> {
    while (document.readyState === 'loading') {
        await delay(50);
    }
}