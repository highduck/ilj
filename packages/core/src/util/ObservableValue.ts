import {Signal} from "./Signal";
import {Disposable} from "./Disposable";

export class ObservableValue<T> {

    readonly changed = new Signal<T>();

    constructor(private _value: T) {
    }

    get value(): T {
        return this._value;
    }

    set value(v: T) {
        if (v !== this._value) {
            this._value = v;
            this.changed.emit(v);
        }
    }

    on(listener: (event: T) => void): Disposable {
        listener(this.value);
        return this.changed.on(listener);
    }
}