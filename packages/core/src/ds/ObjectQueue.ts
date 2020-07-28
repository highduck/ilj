export class ObjectQueue<T extends object> {
    count: number = 0;
    cap: number = 1;
    pool: T[];

    constructor(readonly ctor: { new(...args: any[]): T; }) {
        this.pool = [new ctor];
    }

    next(): T {
        if (this.count === this.cap) {
            this.pool[this.cap++] = new this.ctor();
        }
        return this.pool[this.count++];
    }

    get(i: number) {
        return this.pool[i];
    }

    reset() {
        this.count = 0;
    }
}
