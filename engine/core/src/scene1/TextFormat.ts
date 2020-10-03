import {Vec2, Color32_ARGB} from "@highduck/math";

export const enum Alignment {
    Left = 1,
    Top = 2,
    Center = 4,
    Right = 8,
    Bottom = 16,
    TopLeft = Top | Left,
    CenterBottom = Center | Bottom,
}

function alignmentVector(alignment: Alignment, out: Vec2): Vec2 {
    out.x = ((alignment & Alignment.Right) != 0) ? 1 :
        (((alignment & Alignment.Left) != 0) ? 0 : 0.5);
    out.y = ((alignment & Alignment.Bottom) != 0) ? 1 :
        (((alignment & Alignment.Top) != 0) ? 0 : 0.5);
    return out;
}

export class TextFormat {
    lineHeight: number;
    lineSpacing = 0;
    // TODO: letterSpacing support
    letterSpacing = 0;

    color: Color32_ARGB = 0xFFFFFFFF;
    readonly alignment = new Vec2(0, 0);

    shadow = false;
    shadowColor: Color32_ARGB = 0xFF000000;
    readonly shadowOffset = new Vec2(1, 1);

    constructor(public size: number = 16, alignment: Alignment = Alignment.TopLeft) {
        this.lineHeight = this.size;
        alignmentVector(alignment, this.alignment);
    }

}
