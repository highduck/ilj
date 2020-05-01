import fs from "fs";
import {Entry} from "./Entry";

export class XFLEntry extends Entry {

    constructor(path: string, root?: Entry) {
        super(path, root);
    }


    create(path: string, root: Entry): Entry {
        return new XFLEntry(path, root);
    }

    content(): any {
        if (this._content === undefined) {
            this._content = fs.readFileSync(this.path, 'utf-8');
        }
        return this._content;
    }
}

