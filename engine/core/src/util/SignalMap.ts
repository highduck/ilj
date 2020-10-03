import {Signal} from "./Signal";

export class SignalMap<T> {
    map = new Map<string, Signal<T>>();

    get(type: string): Signal<T> {
        let sig = this.map.get(type);
        if (sig === undefined) {
            sig = new Signal<T>();
            this.map.set(type, sig);
        }
        return sig;
    }

    on(type: string, listener: (data: T) => void) {
        this.get(type).on(listener);
    }

    once(type: string, listener: (data: T) => void) {
        this.get(type).once(listener);
    }

    off(type: string, listener: (data: T) => void) {
        const sig = this.map.get(type);
        if (sig !== undefined) {
            sig.off(listener);
        }
    }
}