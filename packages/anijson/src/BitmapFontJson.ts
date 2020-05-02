export interface GlyphJson {
    codes: number[]; /* u32 */
    box: [number, number, number, number]; /* s16 */
    advance_width: number; /* int */
    sprite: string | null;
}

export interface FontJson {
    units_per_em: number; /* u16 */
    glyphs: GlyphJson[];
    sizes: number[]; /* u16[] */
}