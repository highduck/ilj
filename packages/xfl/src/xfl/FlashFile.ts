import {Entry} from "./Entry";
import {Element} from "./types";
import {DOMDocument, DOMSymbolItem, ElementType} from "./dom";
import path from "path";
import {oneOrMany} from "./parsing";
import he from 'he';
import {loadBitmap} from "./Bitmap";

function loadXml(entry: Entry, path: string) {
    return entry.open(path).xml();
}

export class FlashFile {
    constructor(readonly root: Entry) {
        const doc = loadXml(root, "DOMDocument.xml").DOMDocument as DOMDocument;
        this.doc = doc;

        for (const item of oneOrMany(doc.fonts?.DOMFontItem)) {
            const el = new Element();
            el.parse(ElementType.font_item, item);
            this.library.push(el);
        }

        for (const item of oneOrMany(doc.media?.DOMBitmapItem)) {
            const el = new Element();
            el.parse(ElementType.bitmap_item, item);
            el.bitmap = loadBitmap(root.open('bin/' + item._bitmapDataHRef));
            console.info(el.item.name);

            this.library.push(el);
        }

        for (const item of oneOrMany(doc.media?.DOMSoundItem)) {
            // auto sound = parse_xml_node<element_t>(item);
            // doc.library.push_back(std::move(sound));
        }

        const includes = oneOrMany(doc.symbols?.Include);
        for (const include of includes) {
            const href = he.decode(include._href);
            const libraryDoc = loadXml(root, path.join("LIBRARY", href));
            const el = new Element();
            el.parse(ElementType.symbol_item, libraryDoc.DOMSymbolItem as DOMSymbolItem);
            this.library.push(el);
        }

        for (const item of oneOrMany(doc.timelines?.DOMTimeline)) {
            const tl = new Element();
            tl.elementType = ElementType.symbol_item;
            tl.item.name = '_scene_' + item._name;
            tl.item.linkageExportForAS = true;
            tl.timeline.parse(item);
            this.scenes.push(tl);
        }
    }

    find(name: string, type: ElementType): Element | undefined {
        for (const s of this.library) {
            if (s.item.name === name && s.elementType === type) {
                return s;
            }
        }
        return undefined;
    }

    findLinkage(linkage: string): Element | undefined {
        for (const s of this.library) {
            if (s.item.linkageClassName === linkage) {
                return s;
            }
        }
        return undefined;
    }

    readonly doc: DOMDocument;
    readonly library: Element[] = [];
    readonly scenes: Element[] = [];
}