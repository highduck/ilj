// simple array double buffering to avoid allocations
// use case: iterate primary array, add active items to secondary and commit to swap
export class ArraySwap<T> {
    primary: T[] = [];
    secondary: T[] = [];
    length = 0;
    length2 = 0;

    commit() {
        const free = this.primary;
        this.primary = this.secondary;
        this.secondary = free;
        this.length = this.length2;
        this.length2 = 0;
    }

    pushPrimary(v: T) {
        if (this.length < this.primary.length) {
            this.primary[this.length++] = v;
        } else {
            this.primary.push(v);
        }
    }

    pushSecondary(v: T) {
        if (this.length2 < this.secondary.length) {
            this.secondary[this.length2++] = v;
        } else {
            this.secondary.push(v);
        }
    }
}