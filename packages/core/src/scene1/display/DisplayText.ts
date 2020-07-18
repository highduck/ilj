import {Display2D, Display2DComponent} from "./Display2D";
import {TextFormat} from "../TextFormat";
import {Rect} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {getStringRepoVersion, parseString, renderString, StringToken} from "../../util/Texts";
import {FontResource} from "../../rtfont/Font";
import {ComponentTypeA} from "../../ecs";

export class DisplayTextComponent extends Display2DComponent {
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
            const font = FontResource.data(this.format.font);
            if (font !== undefined) {
                font.drawText(this._rendered, this.format, this.rect);
            }
        }
    }

    getBounds(out: Rect): Rect {
        out.set(0, 0, 0, 0);
        this.invalidateText();
        if (this._rendered.length > 0) {
            const font = FontResource.data(this.format.font);
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

export const DisplayText = new ComponentTypeA(DisplayTextComponent, Display2D);