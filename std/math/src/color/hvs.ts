
// HVSColor - [hue, value, saturation, alpha]

// 7
import {Color4} from "./Color4";

const HUE_TABLE: Color4[] = [
  new Color4(1.0, 0.0, 0.0, 1.0),
  new Color4(1.0, 1.0, 0.0, 1.0),
  new Color4(0.0, 1.0, 0.0, 1.0),
  new Color4(0.0, 1.0, 1.0, 1.0),
  new Color4(0.0, 0.0, 1.0, 1.0),
  new Color4(1.0, 0.0, 1.0, 1.0),
  new Color4(1.0, 0.0, 0.0, 1.0),
];

function rgbHue(max: number, delta: number, r: number, g: number, b: number): number {
  let hue:number;
  if (r >= max) {
    hue = (g - b) / delta;
  } else if (g >= max) {
    hue = 2.0 + (b - r) / delta;
  } else {
    hue = 4.0 + (r - g) / delta;
  }

  hue /= HUE_TABLE.length - 1;
  if (hue < 0.0) {
    hue += 1.0;
  }

  return hue;
}

function lerpChannel(value: number, x: number, y: number) {
  // CHANNEL = lerp(0, lerp(1, value, x), y);
  // T = lerp(1, value, x) = 1 - x + x * value;
  // CHANNEL = lerp(0, T, y) = y * (1 - x + x * value)
  return (1.0 - x + x * value) * y;
}

export function toRGB(hvs: Color4): Color4 {
  const hue = hvs.r;
  const value = hvs.g;
  const saturation = hvs.b;

  initHue(hvs, hue);
  hvs.r = lerpChannel(hvs.r, saturation, value);
  hvs.g = lerpChannel(hvs.g, saturation, value);
  hvs.b = lerpChannel(hvs.b, saturation, value);
  return hvs;
}

export function toHVS(rgb: Color4): Color4 {
  const r = rgb.r;
  const g = rgb.g;
  const b = rgb.b;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  // value:
  rgb.g = max / 255.0;

  if (max > 0.0 && delta > 0.0) {
    // saturation
    rgb.b = delta / max;
    // hue:
    rgb.r = rgbHue(max, delta, r, g, b);
  } else {
    // saturation
    rgb.b = 0.0;
    // hue:
    rgb.r = -1.0;
  }
  return rgb;
}

export function initHue(out: Color4, hue: number) {
  const t = (hue < 0 ? 0 : (hue > 1 ? 1 : hue)) * (HUE_TABLE.length - 1);
  const i = t | 0;
  out.copyFrom(HUE_TABLE[i]).lerp(HUE_TABLE[i + 1], t - i);
}
