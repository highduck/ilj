export type EaseFunction = (t: number) => number;

export const step = (t: number) => t < 1 ? 0 : 1;

export const linear = (t: number) => t;

export const easeOut = (eq: EaseFunction) => (t: number) =>
    1 - eq(1 - t);

export const easeInOut = (eq: EaseFunction) => (t: number) =>
    0.5 * (t <= 0.5 ? eq(2 * t) : (2 - eq(2 * (1 - t))));

export const easeOutIn = (eq: EaseFunction) => (t: number) =>
    0.5 * (1 - (t <= 0.5 ? eq(1 - 2 * t) : -eq(2 * t - 1)));

// Classic Polynomials
export const polynom = (degree: number) => (t: number) => t ** degree;

export const quadIn = polynom(2);
export const quadOut = easeOut(quadIn);
export const quadInOut = easeInOut(quadIn);
export const quadOutIn = easeOutIn(quadIn);

export const cubicIn = polynom(3);
export const cubicOut = easeOut(cubicIn);
export const cubicInOut = easeInOut(cubicIn);
export const cubicOutIn = easeOutIn(cubicIn);

export const quartIn = polynom(4);
export const quartOut = easeOut(quartIn);
export const quartInOut = easeInOut(quartIn);
export const quartOutIn = easeOutIn(quartIn);

// Elastic
export const elastic =
    (amplitude = 0.1, period = 0.4) =>
        (t: number) => {
            if (t <= 0.0) {
                return 0.0;
            }
            if (t >= 1.0) {
                return 1.0;
            }
            let s: number;
            let a = amplitude;
            if (a < 1.0) {
                a = 1.0;
                s = period / 4.0;
            } else {
                s = period / (2.0 * Math.PI) * Math.asin(1.0 / a);
            }
            const tm1 = t - 1.0;
            return -(a * (2.0 ** (10.0 * tm1)) * Math.sin((tm1 - s) * (2 * Math.PI) / period));
        };
export const elasticIn = elastic();
export const elasticOut = easeOut(elasticIn);
export const elasticInOut = easeInOut(elasticIn);
export const elasticOutIn = easeOutIn(elasticIn);

// Circ
export const circIn = (t: number) => 1 - Math.sqrt(Math.max(0, 1 - t * t));
export const circOut = easeOut(circIn);
export const circInOut = easeInOut(circIn);
export const circOutIn = easeOutIn(circIn);

// Expo
export const expoIn = (t: number) => t <= 0 ? 0 : (2 ** (10 * (t - 1)));
export const expoOut = easeOut(expoIn);
export const expoInOut = easeInOut(expoIn);
export const expoOutIn = easeOutIn(expoIn);

// Sine
export const sineIn = (t: number) => t < 1 ? (1 - Math.cos(t * Math.PI * 0.5)) : 1;
export const sineOut = easeOut(sineIn);
export const sineInOut = easeInOut(sineIn);
export const sineOutIn = easeOutIn(sineIn);

// Back
export const back =
    (overshoot = 1.70158) => (t: number) =>
        t >= 1 ? 1 : (t * t * ((overshoot + 1) * t - overshoot));
export const backIn = back();
export const backOut = easeOut(backIn);
export const backInOut = easeInOut(backIn);
export const backOutIn = easeOutIn(backIn);

// Bounce
const B1 = 1.0 / 2.75;
const B2 = 2.0 / 2.75;
const B3 = 1.5 / 2.75;
const B4 = 2.5 / 2.75;
const B5 = 2.25 / 2.75;
const B6 = 2.625 / 2.75;

export const bounceIn = (t: number) => {
    t = 1.0 - t;
    if (t < B1) {
        return 1.0 - 7.5625 * t * t;
    }
    if (t < B2) {
        return 1.0 - (7.5625 * (t - B3) * (t - B3) + 0.75);
    }
    if (t < B4) {
        return 1.0 - (7.5625 * (t - B5) * (t - B5) + 0.9375);
    }
    return 1.0 - (7.5625 * (t - B6) * (t - B6) + 0.984375);
};
export const bounceOut = easeOut(bounceIn);
export const bounceInOut = easeInOut(bounceIn);
export const bounceOutIn = easeOutIn(bounceIn);
