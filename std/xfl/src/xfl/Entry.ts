import path from 'path';
import fxp from 'fast-xml-parser';

export class Entry {

    protected _children = new Map<string, Entry>();
    protected _xmlObject: any = undefined;
    protected _text: undefined | string = undefined;
    protected _buffer: undefined | Uint8Array = undefined;
    readonly path: string;
    readonly root: Entry;

    constructor(path: string, root?: Entry) {
        this.path = path;
        this.root = root ?? this;
    }

    xml(relPath?: string): any {
        const e = relPath !== undefined ? this.open(relPath) : this;
        return e.getXMLObject();
    }

    getXMLObject(): any {
        if (this._xmlObject === undefined) {
            this._xmlObject = fxp.parse(this.text(), {
                attributeNamePrefix: "_",
                textNodeName: "$",
                ignoreAttributes: false,
                allowBooleanAttributes: true,
                parseAttributeValue: true,
                ignoreNameSpace: true
            });
        }
        return this._xmlObject;
    }

    text(): string {
        if (this._text === undefined) {
            throw "no content";
        }
        return this._text;
    }

    buffer(): Uint8Array {
        if (this._buffer === undefined) {
            throw "no buffer";
        }
        return this._buffer;
    }

    open(relativePath: string): Entry {
        const childPath = path.join(this.path, relativePath);
        let entry = this.root._children.get(childPath);
        if (entry === undefined) {
            entry = this.create(childPath, this.root);
            this.root._children.set(childPath, entry);
        }
        return entry;
    }

    dispose() {

    }

    create(path: string, root: Entry): Entry {
        return new Entry(path, root);
    }
}