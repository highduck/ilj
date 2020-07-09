import {Display2D} from "./Display2D";
import {TextFormat} from "../TextFormat";
import {Rect} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {declTypeID} from "../../util/TypeID";
import {Resources} from "../../util/Resources";
import {getStringRepoVersion, parseString, renderString, StringToken} from "../../util/Texts";
import {DynamicFont} from "../../rtfont/DynamicFont";

export class DisplayText extends Display2D {
    static TYPE_ID = declTypeID(Display2D);

    _tokens: StringToken[] = [];
    _rendered: string = '';
    _pollCounter: number = 0;
    _pollVersion: number = -1;

    pollFrequency = 10;

    readonly format = new TextFormat("mini", 16);
    readonly rect = new Rect();

    constructor() {
        super();
    }

    invalidateText() {
        const repoVersion = getStringRepoVersion();
        if (--this._pollCounter < 0 || this._pollVersion !== repoVersion) {
            this._rendered = renderString(this._tokens);
            this._pollCounter = this.pollFrequency;
            this._pollVersion = repoVersion;
        }
    }

    draw(drawer: Drawer) {
        this.invalidateText();
        if (this._rendered.length > 0) {
            const font = Resources.get(DynamicFont, this.format.font).data;
            if (font !== undefined) {
                font.drawText(this._rendered, this.format, this.rect);
            }
        }
    }

    getBounds(out: Rect): Rect {
        out.set(0, 0, 0, 0);
        this.invalidateText();
        if (this._rendered.length > 0) {
            const font = Resources.data(DynamicFont, this.format.font);
            if (font !== undefined) {
                font.textBounds(this._rendered, this.format, this.rect, out);
            }
        }
        return out;
    }

    set text(value: string) {
        this._tokens = parseString(value);

        this._pollCounter = 0;
        this.invalidateText();
    }

    get text(): string {
        this._pollCounter = 0;
        this.invalidateText();

        return this._rendered;
    }

    setText(v: string): this {
        this.text = v;
        return this;
    }

    setKey(key: string | undefined): this {
        this._tokens =
            key !== undefined ? [{
                kind: 1,
                value: key
            }] : [];
        return this;
    }
}
