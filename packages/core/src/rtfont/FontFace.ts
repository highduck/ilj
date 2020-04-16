import {loadBuffer} from "../util/load";

const testSize = '250px';
const testString = 'Quid pro quo';
const interval = 500;
const maxAttempts = 60; // 30 secs

let test: undefined | HTMLSpanElement = undefined;

/**
 * Checks if a font is loaded
 * @param  {string}  family  The name of a font family.
 * @return {Boolean}         True if the font is loaded, false otherwise.
 */
function isFontLoaded(family: string): boolean {
    let testWidth;
    let actualWidth;

    if (test === undefined) {
        test = document.createElement('span');
        test.innerHTML = testString;
        test.style.position = 'fixed';
        test.style.top = '-99999px';
        test.style.left = '-99999px';
        test.style.visibility = 'hidden';
        test.style.fontSize = testSize;
        document.body.appendChild(test);
    }
    test.style.fontFamily = 'monospace';
    testWidth = test.offsetWidth;
    test.style.fontFamily = family + ', monospace';
    actualWidth = test.offsetWidth;
    if (testWidth !== actualWidth) {
        return true;
    }
    test.style.fontFamily = 'serif';
    testWidth = test.offsetWidth;
    test.style.fontFamily = family + ', serif';
    actualWidth = test.offsetWidth;
    return testWidth !== actualWidth;
}

async function watchFont(family: string) {
    return new Promise((resolve, reject) => {
        let times = 0;
        const timer = setInterval(() => {
            times += 1;
            if (isFontLoaded(family)) {
                clearInterval(timer);
                resolve();
            } else if (times > maxAttempts) {
                clearInterval(timer);
                reject('Timed out.');
            }
        }, interval);
    });
}

export class FontFace {
    //featureSettings = 'normal';
    status = 'unloaded';
    //stretch = 'normal';
    // style = 'normal';
    // unicodeRange = 'U+0-10FFFF';
    // variant = 'normal';
    // weight = 'normal';

    /**
     * Creates a new FontFace object
     * @constructor
     * @param {string} family    The name of a font family.
     * @param {string} src       The css src attribute of a font family.
     * @param {Object} [options] Extra options to define the font.
     */
    constructor(readonly family: string,
                readonly src: string,
                readonly options: any) {
    }

    async load() {
        if (this.status !== 'unloaded') {
            return;
        }
        if (isFontLoaded(this.family)) {
            this.status = 'loaded';
            return;
        }

        this.status = 'loading';
        try {
            const data = await loadBuffer(this.src);
            const blob = new Blob([data]);
            const fontSrc = URL.createObjectURL(blob);
            const styleSheet = document.styleSheets[0] as CSSStyleSheet;
            const fontRule = `@font-face { font-family: '${this.family}'; src: url('${fontSrc}') format('truetype'); }`;
            styleSheet.insertRule(fontRule, 0);
            await watchFont(this.family);
        } catch (e) {
            this.status = 'error';
            console.warn('load font error: ' + e);
            // rethrow
            throw e;
        }
        this.status = 'loaded';
    };
}