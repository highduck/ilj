import fs from "fs";
import {Entry} from "./Entry";

export class XFLEntry extends Entry {

    constructor(path: string, root?: Entry) {
        super(path, root);
    }


    create(path: string, root: Entry): Entry {
        return new XFLEntry(path, root);
    }

    text(): string {
        if (this._text === undefined) {
            this._text = fs.readFileSync(this.path, 'utf8');
        }
        return this._text;
    }

    buffer(): Uint8Array {
        if (this._buffer === undefined) {
            const result = fs.readFileSync(this.path, null);
            // slice read buffer
            this._buffer = new Uint8Array(result);
        }
        return this._buffer;
    }
}

