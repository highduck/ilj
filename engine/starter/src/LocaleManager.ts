import {loadJSON, setLocale} from "@highduck/core";
import {Plugins} from "@capacitor/core";

const {Storage, Device} = Plugins;

async function getLanguage(defaultLang: string): Promise<string> {
    let lang = (await Storage.get({key: 'lang'})).value;
    // console.info('saved pref lang: ' + lang);
    if (lang == null) {
        lang = (await Device.getLanguageCode()).value;
        // console.info('auto-detected lang: ' + lang);
    }
    if (lang == null || lang.length < 2) {
        // console.info('test lang 0: ' + lang);
        lang = 'en';
    }
    return lang;
}

export class LocaleManager {

    constructor(readonly baseLang: string,
                public currentLang: string,
                readonly data: { [lang: string]: any }) {
        if (this.data[this.currentLang] == null) {
            this.currentLang = this.baseLang;
        }
        setLocale(this.data[this.baseLang], this.data[this.currentLang]);
    }

    static async createAsync(baseLang: string, path: string) {
        const [lang, data] = await Promise.all([getLanguage(baseLang), loadJSON(path)]);
        return new LocaleManager(baseLang, lang, data);
    }

    selectNextLang() {
        const langIds = Object.keys(this.data);
        let i = langIds.indexOf(this.currentLang) + 1;
        if (i >= langIds.length) {
            i = 0;
        }
        this.currentLang = langIds[i];
        Plugins.Storage.set({key: 'lang', value: this.currentLang}).then();
        setLocale(this.data[this.baseLang], this.data[this.currentLang]);
    }
}