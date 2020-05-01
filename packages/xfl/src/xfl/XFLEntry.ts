import fs from "fs";
import {Entry} from "./Entry";

export class XFLEntry extends Entry {

    constructor(path: string, root?: Entry) {
        super(path, root);
    }


    create(path: string, root: Entry): Entry {
        return new XFLEntry(path, root);
    }

    content(): string {
        if (this._content === undefined) {
            this._content = fs.readFileSync(this.path, 'utf8');
        }
        return this._content;
    }

    buffer(): Uint8Array {
        if (this._buffer === undefined) {
            this._buffer = new Uint8Array(fs.readFileSync(this.path, null).buffer);
        }
        return this._buffer;
    }
}

