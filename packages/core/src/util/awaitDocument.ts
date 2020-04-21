import {delay} from "./delay";

function checkDocumentIsLoading() {
    const state = document.readyState;
    if (state === 'loading') {
        return true;
    }
    const rc = document.body.getBoundingClientRect();
    return rc.width <= 1 || rc.height <= 1;
}

export async function awaitDocument(): Promise<void> {
    while (checkDocumentIsLoading()) {
        //console.debug("awaitDocument...");
        await delay(33);
    }
}