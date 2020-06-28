export interface PoolOptions<T> {
    max?: number;
    create: () => T;
    allocate?: (item: T) => void;
    release?: (item: T) => void;
    discard?: (item: T) => T;
}

export class Pool<T> {
    _list: T[] = [];
    _max: number;

    _createFn: () => T;
    _outFn?: (item: T) => void;
    _inFn?: (item: T) => void;
    _discardFn?: (item: T) => T;

    _createCount = 0;
    _outCount = 0;
    _inCount = 0;
    _discardCount = 0;

    constructor(opts: PoolOptions<T>) {
        this._max = opts.max ?? 0x7FFFFFFF;
        this._createFn = opts.create;
        this._outFn = opts.allocate;
        this._inFn = opts.release;
        this._discardFn = opts.discard;
    }

    get size() {
        return this._list.length;
    }

    allocate(): T {
        let item!: T;
        if (this._list.length > 0) {
            item = this._list.shift()!;
        } else {
            this._createCount++;
            item = this._createFn();
        }
        ++this._outCount;
        if (this._outFn !== undefined) {
            this._outFn(item);
        }
        return item;
    }

    release(item: T) {
        if (this._list.length < this._max) {
            ++this._inCount;
            if (this._inFn !== undefined) {
                this._inFn(item);
            }
            this._list.push(item);
        } else {
            ++this._discardCount;
            if (this._discardFn !== undefined) {
                this._discardFn(item);
            }
        }
    }

    toString() {
        return " +" + this._createCount + " >" + this._outCount + " <" + this._inCount + " -"
            + this._discardCount + " =" + this._list.length + "/" + this._max;
    }
}