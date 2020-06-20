import {Entity} from "../../ecs/Entity";
import {Ani} from "../ani/Ani";
import {AssetRef} from "../../util/Resources";
import {Transform2D} from "./Transform2D";
import {declTypeID} from "../../util/TypeID";
import {KeyframeJson, MovieJson} from "@highduck/anijson";

// const cos = Math.cos;
// const sin = Math.sin;
/*** EASING CALCULATION ***/

// math is not hard, but code has been stolen from precious web,
// look for `fl.motion`, BezierEase, BezierSegment, CustomEase

function get_quadratic_roots(out_roots: number[], a: number, b: number, c: number): number {
// make sure we have a quadratic
    if (a === 0.0) {
        if (b === 0.0) {
            return 0;
        }
        out_roots[0] = -c / b;
        return 1;
    }

    const q = b * b - 4 * a * c;

    if (q > 0.0) {
        const c = Math.sqrt(q) / (2 * a);
        const d = -b / (2 * a);
        out_roots[0] = d - c;
        out_roots[1] = d + c;
        return 2;
    } else if (q < 0.0) {
        return 0;
    }
    out_roots[0] = -b / (2 * a);
    return 1;
}

function get_cubic_roots(out_roots: number[], a: number, b: number, c: number, d: number): number {
    // make sure we really have a cubic
    if (a === 0.0) {
        return get_quadratic_roots(out_roots, b, c, d);
    }

    // normalize the coefficients so the cubed term is 1 and we can ignore it hereafter
    b /= a;
    c /= a;
    d /= a;

    const q = (b * b - 3 * c) / 9;               // won't change over course of curve
    const q_cubed = q * q * q;                  // won't change over course of curve
    const r = (2 * b * b * b - 9 * b * c + 27 * d) / 54; // will change because d changes
    // but parts with b and c won't change
    // determine if there are 1 or 3 real roots using r and q
    const diff = q_cubed - r * r;
    if (diff >= 0.0) {
        // avoid division by zero
        if (q === 0.0) {
            out_roots[0] = 0.0;
            return 1;
        }

        // three real roots
        const theta = Math.acos(r / Math.sqrt(q_cubed)); // will change because r changes
        const q_sqrt = Math.sqrt(q); // won't change

        out_roots[0] = -2 * q_sqrt * Math.cos(theta / 3) - b / 3;
        out_roots[1] = -2 * q_sqrt * Math.cos((theta + 2 * Math.PI) / 3) - b / 3;
        out_roots[2] = -2 * q_sqrt * Math.cos((theta + 4 * Math.PI) / 3) - b / 3;

        return 3;
    }
    // one real root
    const tmp = Math.pow(Math.sqrt(-diff) + Math.abs(r), 1.0 / 3.0);

    // TODO: Math.sign?
    const r_sign = r > 0.0 ? 1.0 : (r < 0.0 ? -1.0 : 0.0);
    out_roots[0] = -r_sign * (tmp + q / tmp) - b / 3;
    return 1;
}

function get_bezier_value_normalized(t: number, a: number, b: number, c: number, d: number): number {
    return (t * t * (d - a) + 3 * (1 - t) * (t * (c - a) + (1 - t) * (b - a))) * t + a;
}

function get_bezier_y(curve: number[], i: number, x: number): number {
    const eps = 0.000001;
    const a = curve[i];
    const b = curve[i + 2];
    const c = curve[i + 4];
    const d = curve[i + 6];

    if (a < d) {
        if (x <= a + eps) return curve[i + 0 + 1];
        if (x >= d - eps) return curve[i + 6 + 1];
    } else {
        if (x >= a + eps) return curve[i + 0 + 1];
        if (x <= d - eps) return curve[i + 6 + 1];
    }

    const c0 = -a + 3 * b - 3 * c + d;
    const c1 = 3 * a - 6 * b + 3 * c;
    const c2 = -3 * a + 3 * b;
    const c3 = a;

    // x(t) = a*t^3 + b*t^2 + c*t + d
    const roots = [0, 0, 0];
    const roots_count = get_cubic_roots(roots, c0, c1, c2, c3 - x);
    let time = 0.0;
    for (let i = 0; i < roots_count; ++i) {
        const r = roots[i];
        if (0.0 <= r && r <= 1.0) {
            time = r;
            break;
        }
    }

    return get_bezier_value_normalized(time,
        curve[i + 0 + 1],
        curve[i + 2 + 1],
        curve[i + 4 + 1],
        curve[i + 6 + 1]);
}

export function ease(x: number, curve?: number[], easing?: number): number {
    if (curve !== undefined) {
        const pointsCount = curve.length >>> 1;
        if (pointsCount > 3) {
            // bezier
            for (let i = 0; i < pointsCount - 3; ++i) {
                const x0 = curve[i << 1];
                const x1 = curve[(i + 3) << 1];
                if (x0 <= x && x <= x1) {
                    return get_bezier_y(curve, i << 1, x);
                }
            }
        }
    }
    if (easing !== undefined && easing !== 0) {
        let e = easing; //  / 100.0
        let t;
        if (e < 0.0) {
            // Ease in
            const inv = 1.0 - x;
            t = 1.0 - inv * inv;
            e = -e;
        } else {
            // Ease out
            t = x * x;
        }
        return e * t + (1.0 - e) * x;
    }
    return x;
}

function findKeyFrame(kfs: KeyframeJson[], t: number): number {
    for (let i = 0; i < kfs.length; ++i) {
        const kf = kfs[i];
        if (t >= kf._[0] && t < kf._[1]) {
            return i;
        }
    }
    return -1;
}

const N2_ONE: [number, number] = [1, 1];
const N2_ZERO: [number, number] = [0, 0];
const N4_ONE: [number, number, number, number] = [1, 1, 1, 1];
const N4_ZERO: [number, number, number, number] = [0, 0, 0, 0];

export class MovieClipTarget {
    static TYPE_ID = declTypeID();

    keyAnimation = 0;
}

export class MovieClip2D {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    libraryAsset?: AssetRef<Ani>;
    movieDataSymbol?: string;
    data?: MovieJson;

    _time = 0.0;
    playing = true;
    dirty = false;
    fps = 24.0;

    discreteMode = false;

    get timeMax(): number {
        const data = this.getMovieClipData();
        return data ? data.l : 0;
    }

    getMovieClipData(): MovieJson | undefined {
        let result = this.data;
        if (!result && this.libraryAsset &&
            this.libraryAsset.data && this.movieDataSymbol) {
            const symbolData = this.libraryAsset.data.lookup[this.movieDataSymbol];
            if (symbolData && symbolData.mc) {
                result = symbolData.mc;
            }
        }
        return result;
    }

    truncTime(data: MovieJson) {
        const t = this._time;
        const max = data.l;
        if (t >= max) {
            this._time -= max * Math.trunc(t / max);
        }
    }

    set time(v: number) {
        this._time = v;
        const data = this.getMovieClipData();
        if (data !== undefined) {
            this.truncTime(data);
            this.applyFrameData(data);
        }
    }

    get time(): number {
        return this._time;
    }

    gotoAndStop(frame: number) {
        this.playing = false;
        this._time = frame;
        this.dirty = true;
    }

    applyFrameData(data: MovieJson) {
        const time = this.discreteMode ? Math.trunc(this._time) : this._time;
        const totalTargets = data.t.length;
        let e = this.entity.childFirst;
        while (e !== undefined) {
            const targetData = e.components.get(MovieClipTarget.TYPE_ID) as MovieClipTarget | undefined;
            if (targetData !== undefined && targetData.keyAnimation < totalTargets) {
                updateTarget(time, e, data.t[targetData.keyAnimation]);
            }
            e = e.siblingNext;
        }
    }
}

function updateTarget(time: number, e: Entity, frames: KeyframeJson[]) {
    const ki = findKeyFrame(frames, time);
    if (ki < 0) {
        e.visible = false;
        return;
    }
    const k1 = frames[ki];
    const k2 = (ki + 1) < frames.length ? frames[ki + 1] : undefined;
    const begin = k1._[0];
    const end = k1._[1];
    e.visible = k1.v ?? true;

    const transform = e.components.get(Transform2D.TYPE_ID) as Transform2D | undefined;
    if (transform !== undefined) {
        const P = transform.position;
        const S = transform.scale;
        const R = transform.skew;
        const CM = transform.colorMultiplier;
        const CO = transform.colorOffset;

        // reset values to initial key frame
        P.setTuple(k1.p !== undefined ? k1.p : N2_ZERO);
        S.setTuple(k1.s !== undefined ? k1.s : N2_ONE);
        R.setTuple(k1.r !== undefined ? k1.r : N2_ZERO);
        CM.setTuple(k1.cm !== undefined ? k1.cm : N4_ONE);
        CO.setTuple(k1.co !== undefined ? k1.co : N4_ZERO);

        // const o = VEC2_TMP_0.setTuple(k1.o !== undefined ? k1.o : N2_ZERO);
        // if tweens are populated, then we assume there is tween motion type (k1.mot === 1)
        if (k1.m === 1 && k2 !== undefined) {
            const progress = (time - begin) / (end - begin);
            let x_position = progress;
            let x_rotation = progress;
            let x_scale = progress;
            let x_color = progress;
            if (k1.ease !== undefined) {
                for (let i = 0; i < k1.ease.length; ++i) {
                    const easing_data = k1.ease[i];
                    const x = ease(progress, easing_data.c, easing_data.v);
                    if (!easing_data.t) {
                        x_position = x_rotation = x_scale = x_color = x;
                    } else if (easing_data.t === 1) {
                        x_position = x;
                    } else if (easing_data.t === 2) {
                        x_rotation = x;
                    } else if (easing_data.t === 3) {
                        x_scale = x;
                    } else if (easing_data.t === 4) {
                        x_color = x;
                    }
                }
            }

            let k2v: [number, number] = k2.p !== undefined ? k2.p : N2_ZERO;
            P.x = P.x * (1 - x_position) + x_position * k2v[0];
            P.y = P.y * (1 - x_position) + x_position * k2v[1];
            k2v = k2.r !== undefined ? k2.r : N2_ZERO;
            R.x = R.x * (1 - x_rotation) + x_rotation * k2v[0];
            R.y = R.y * (1 - x_rotation) + x_rotation * k2v[1];
            k2v = k2.s !== undefined ? k2.s : N2_ONE;
            S.x = S.x * (1 - x_scale) + x_scale * k2v[0];
            S.y = S.y * (1 - x_scale) + x_scale * k2v[1];

            CM.lerpTuple(k2.cm !== undefined ? k2.cm : N4_ONE, x_color);
            CO.lerpTuple(k2.co !== undefined ? k2.co : N4_ZERO, x_color);
        }
        if (k1.o !== undefined) {
            const sx = k1.o[0] * S.x;
            const sy = k1.o[1] * S.y;
            const rx = R.x;
            const ry = R.y;
            P.x -= Math.cos(ry) * sx - Math.sin(rx) * sy;
            P.y -= Math.sin(ry) * sx + Math.cos(rx) * sy;
        }
    }

    if (k1.l !== undefined) {
        const mc = e.components.get(MovieClip2D.TYPE_ID) as MovieClip2D | undefined;
        if (mc !== undefined) {
            const loop = k1.l[0];
            if (loop === 0) {
                mc.gotoAndStop(time - begin);
            } else if (loop === 1) {
                const offset = Math.min(time, end) - begin;
                let t = k1.l[1] + offset;
                const mcData = mc.getMovieClipData();
                if (mcData && t > mcData.l) {
                    t = mcData.l;
                }
                mc.gotoAndStop(t);
            } else if (loop === 2) {
                mc.gotoAndStop(k1.l[1]);
            }
        }
    }
}