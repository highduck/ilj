import {Entry} from "./Entry";
import {Element} from "./types";
import {DOMDocument, DOMSymbolItem, ElementType} from "./dom";
import path from "path";
import {oneOrMany} from "./parsing";
import he from 'he';

function loadXml(entry: Entry, path: string) {
    return entry.open(path).xml();
}

export class FlashFile {
    constructor(readonly root: Entry) {
        const doc = loadXml(root, "DOMDocument.xml").DOMDocument as DOMDocument;
        // console.log(JSON.stringify(doc, null, 2));
        this.doc = doc;

        // for (const auto& item: node.child("fonts").children("DOMFontItem")) {
        //     doc.library.push_back(parse_xml_node<element_t>(item));
        // }
        //
        // for (const auto& item: node.child("media").children("DOMBitmapItem")) {
        //     auto bi = parse_xml_node<element_t>(item);
        //     bi.bitmap.reset(load_bitmap(*root.open(path_t{"bin"} / bi.bitmapDataHRef)));
        //     doc.library.push_back(std::move(bi));
        // }
        //
        // for (const auto& item: node.child("media").children("DOMSoundItem")) {
        //     auto sound = parse_xml_node<element_t>(item);
        //     doc.library.push_back(std::move(sound));
        // }
        //
        const includes = oneOrMany(doc.symbols?.Include);
        // console.log(JSON.stringify(doc, null, 2));
        for (const include of includes) {
            const href = he.decode(include.$href);
            const libraryDoc = loadXml(root, path.join("LIBRARY", href));
            //console.log(JSON.stringify(libraryDoc, null, 2));
            const el = new Element();
            el.parse(ElementType.symbol_item, libraryDoc.DOMSymbolItem as DOMSymbolItem);
            this.library.push(el);
        }
        //
        // for (const auto& item: node.child("timelines").children("DOMTimeline")) {
        //     doc.timelines.push_back(parse_xml_node<timeline_t>(item));
        // }
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
}