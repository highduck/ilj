import path from 'path';

const fxp = require('fast-xml-parser');

export class Entry {

    protected _children = new Map<string, Entry>();
    protected _xmlObject: any = undefined;
    protected _content: undefined | string = undefined;
    protected _buffer: undefined | Uint8Array = undefined;
    readonly path: string;
    readonly root: Entry;

    constructor(path: string, root?: Entry) {
        this.path = path;
        this.root = root ?? this;
    }

    xml(): any {
        if (this._xmlObject === undefined) {
            const t = this.content() as string;
            if (t) {
                this._xmlObject = fxp.parse(t, {
                    attributeNamePrefix: "$",
                    // attrNodeName: "attr",
                    textNodeName: "$_text",
                    ignoreAttributes: false,
                    allowBooleanAttributes: true,
                    parseAttributeValue: true,
                    ignoreNameSpace: true,
                    // arrayMode: true
                });
            }
        }
        return this._xmlObject;
    }

    content(): string {
        if(this._content === undefined) {
            throw "no content";
        }
        return this._content;
    }

    buffer(): Uint8Array {
        if(this._buffer === undefined) {
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