export class MathUtil {
    static readonly EPSILON: number = 1e-9;
    static readonly SQUARED_EPSILON: number = 1e-18; // EPSILON ^ 2

    /**
     * This function is used to ensure that a floating point number is not a NaN or
     * infinity.
     */
    static isFinite(n: any): boolean {
        return (typeof n === 'number') && isFinite(n) && !isNaN(n);
    }

    static assert(n: any) {
        if (!PLANCK_ASSERT) return;
        if (!MathUtil.isFinite(n)) {
            PLANCK_DEBUG && console.debug(n);
            throw new Error('Invalid Number!');
        }
    }

    /**
     * TODO: This is a approximate yet fast inverse square-root.
     */
    static invSqrt(x: number): number {
        // TODO
        return 1 / Math.sqrt(x);
    }

    /**
     * Next Largest Power of 2 Given a binary integer value x, the next largest
     * power of 2 can be computed by a SWAR algorithm that recursively "folds" the
     * upper bits into the lower bits. This process yields a bit vector with the
     * same most significant 1 as x, but all 1's below it. Adding 1 to that value
     * yields the next largest power of 2. For a 32-bit value:
     */
    static nextPowerOfTwo(n: number): number {
        // TODO
        n |= (n >>> 1);
        n |= (n >>> 2);
        n |= (n >>> 4);
        n |= (n >>> 8);
        n |= (n >>> 16);
        return n + 1;
    }

    static isPowerOfTwo(n: number): boolean {
        return n > 0 && (n & (n - 1)) === 0;
    }

    static mod(num: number, min: number, max: number): number {
        PLANCK_ASSERT && min > max && console.error('Math.mod [min] should be less than [max]');
        num = (num - min) % (max - min);
        return num + (num < 0 ? max : min);
    }

    static clamp(num: number, min: number, max: number): number {
        PLANCK_ASSERT && min > max && console.error('Math.mod [min] should be less than [max]');
        return num < min ? min : (num > max ? max : num);
    }

    // static random(min, max) {
    //     if (typeof min === 'undefined') {
    //         max = 1;
    //         min = 0;
    //     } else if (typeof max === 'undefined') {
    //         max = min;
    //         min = 0;
    //     }
    //     return min == max ? min : Math.random() * (max - min) + min;
    // }

}