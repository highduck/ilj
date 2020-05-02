export class SgBitmapFontGlyph {
    codes: number[] = [];
    box: [number, number, number, number] = [0, 0, 0, 0];
    advance_width = 0;
    sprite = "";

    serialize() {
        return {
            codes: this.codes,
            box: this.box,
            advance_width: this.advance_width,
            sprite: this.sprite.length > 0 ? this.sprite.length : undefined
        };
    }
}

export class SgBitmapFont {
    units_per_em = 0;
    glyphs: SgBitmapFontGlyph[] = [];
    sizes: number[] = [];

    serialize() {
        return {
            units_per_em: this.units_per_em,
            glyphs: this.glyphs.map((v) => v.serialize()),
            sizes: this.sizes
        };
    }
}
