/* tslint:disable:no-bitwise */

// function initClamp255(): Uint8Array {
//     const arr = new Uint8Array(512);
//     for (let i = 0; i < 512; ++i) {
//         arr[i] = i < 0xFF ? i : 0xFF;
//     }
//     return arr;
// }
//
// const CLAMP_255 = initClamp255();

export type Color32 = number;
export type Color32_ABGR_PMA = number;
export type Color32_ABGR = number;
export type Color32_ARGB = number;

export function color32_pack_floats(b0: number, b1: number, b2: number, b3: number): Color32 {
    return (((b0 * 0xFF) & 0xFF) << 24) |
        (((b1 * 0xFF) & 0xFF) << 16) |
        (((b2 * 0xFF) & 0xFF) << 8) |
        ((b3 * 0xFF) & 0xFF);
}

export function color32_pack_bytes(b0: number, b1: number, b2: number, b3: number): Color32 {
    return ((b0 & 0xFF) << 24) |
        ((b1 & 0xFF) << 16) |
        ((b2 & 0xFF) << 8) |
        (b3 & 0xFF);
}

//
// export function color32_set_af(color: Color32_ARGB, alpha: number): Color32_ARGB {
//     return (color & 0xFFFFFF) | (((alpha * 255) | 0) << 24);
// }
//
// export function color32_lerp(begin: Color32, end: Color32, t: number): Color32 {
//     const r = (t * 1024) | 0;
//     const ri = 1024 - r;
//     const b0 = ((begin >>> 24) * ri + (end >>> 24) * r) >>> 10;
//     const b1 = ((0xFF & (begin >>> 16)) * ri + (0xFF & (end >>> 16)) * r) >>> 10;
//     const b2 = ((0xFF & (begin >>> 8)) * ri + (0xFF & (end >>> 8)) * r) >>> 10;
//     const b3 = ((0xFF & begin) * ri + (0xFF & end) * r) >>> 10;
//     return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
// }
//
// export function color32_ARGB_to_ABGR_PMA(argb: Color32_ARGB, additive: number /* u8 */): Color32_ABGR_PMA {
//     const a = argb >>> 24;
//     const r = (argb >>> 16) & 0xFF;
//     const g = (argb >>> 8) & 0xFF;
//     const b = argb & 0xFF;
//
//     return (((a * (0xFF - additive) * 258) & 0x00FF0000) << 8) |
//         (((a * b * 258) & 0x00FF0000)) |
//         (((a * g * 258) & 0x00FF0000) >>> 8) |
//         (((a * r * 258) >>> 16));
// }
//
// export function color32_ARGB_to_BGR(argb: Color32_ARGB): Color32_ABGR {
//     return (/* __G_ */ argb & 0x0000FF00) | ((/* B */ argb & 0xFF) << 16) | (/* R */(argb >>> 16) & 0xFF);
// }
//
// export function color32_ARGB_to_ABGR(argb: Color32_ARGB): Color32_ABGR {
//     return (/* A_G_ */ argb & 0xFF00FF00) | ((/* B */ argb & 0xFF) << 16) | (/* R */(argb >>> 16) & 0xFF);
// }
//
// export function color32_add(l: Color32, r: Color32): Color32 {
//     return (CLAMP_255[(l >>> 24) + (r >>> 24)] << 24) |
//         (CLAMP_255[((l >>> 16) & 0xFF) + ((r >>> 16) & 0xFF)] << 16) |
//         (CLAMP_255[((l >>> 8) & 0xFF) + ((r >>> 8) & 0xFF)] << 8) |
//         (CLAMP_255[(l & 0xFF) + (r & 0xFF)]);
// }
//
// export function color32_mul(l: Color32, r: Color32): Color32 {
//     return ((((l >>> 24) * (r >>> 24) * 258) >>> 16) << 24) |
//         (((((l >>> 16) & 0xFF) * ((r >>> 16) & 0xFF) * 258) >>> 16) << 16) |
//         (((((l >>> 8) & 0xFF) * ((r >>> 8) & 0xFF) * 258) >>> 16) << 8) |
//         ((((l & 0xFF) * (r & 0xFF) * 258) >>> 16));
// }
//
// export function color32_calc_offset(offset: Color32, mult: Color32, shift: Color32): Color32 {
//     // return (offset & 0xFF000000) |
//     return (CLAMP_255[(offset >>> 24) + (shift >>> 24)] << 24) |
//         (CLAMP_255[((((offset >>> 16) & 0xFF) * ((mult >>> 16) & 0xFF) * 258) >> 16) + ((shift >>> 16) & 0xFF)] << 16) |
//         (CLAMP_255[((((offset >>> 8) & 0xFF) * ((mult >>> 8) & 0xFF) * 258) >> 16) + ((shift >>> 8) & 0xFF)] << 8) |
//         CLAMP_255[(((offset & 0xFF) * (mult & 0xFF) * 258) >> 16) + (shift & 0xFF)];
// }
