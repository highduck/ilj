// simple array double buffering to avoid allocations
// use case: iterate primary array, add active items to secondary and commit to swap
export class ArraySwap<T> {
    primary: T[] = [];
    secondary: T[] = [];

    commit() {
        const free = this.primary;
        this.primary = this.secondary;
        this.secondary = free;
        free.length = 0;
    }
}