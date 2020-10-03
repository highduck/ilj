import {Display2D, Display2DComponent} from "./Display2D";
import {TextFormat} from "../TextFormat";
import {Recta} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {getStringRepoVersion, parseString, renderString, StringTokenArray, StringTokenKind} from "../../util/Texts";
import {Font} from "../../rtfont/Font";
import {ComponentTypeA} from "../../ecs";
import {AssetRef} from "../../util/Resources";

export class DisplayTextComponent extends Display2DComponent {
    _tokens = StringTokenArray.EMPTY;
    _rendered: string = '';
    _pollCounter: number = 0;
    _pollVersion: number = -1;

    pollFrequency = 10;

    readonly format = new TextFormat();
    readonly rect = new Recta();
    font: AssetRef<Font> = AssetRef.NONE;

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
        const font = this.font.data;
        if (this._rendered.length > 0 && font !== null) {
            font.drawText(this._rendered, this.format, this.rect);
        }
    }

    getBounds(out: Recta): void {
        this.invalidateText();
        const font = this.font.data;
        if (this._rendered.length > 0 && font !== null) {
            font.textBounds(this._rendered, this.format, this.rect, out);
        } else {
            out.set(0, 0, 0, 0);
        }
    }

    set text(value: string) {
        this._tokens = new StringTokenArray();
        parseString(value, this._tokens);

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
        if (key !== undefined) {
            this._tokens = new StringTokenArray();
            this._tokens.kinds[0] = StringTokenKind.Key;
            this._tokens.values[0] = key;
            this._tokens.count = 1;
        } else {
            this._tokens = StringTokenArray.EMPTY;
        }
        return this;
    }
}

export const DisplayText = new ComponentTypeA(DisplayTextComponent, Display2D);