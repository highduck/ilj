export interface GlyphJson {
    codes: number[]; /* u32 */
    box: [number, number, number, number]; /* s16 */
    advanceX: number; /* int */
    sprite: string | null;
}

export interface FontJson {
    unitsPerEM: number; /* u16 */
    glyphs: GlyphJson[];
    sizes: number[]; /* u16[] */
}