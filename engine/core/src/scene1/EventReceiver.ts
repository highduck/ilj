import {SignalMap} from "../util/SignalMap";
import {Entity, ComponentTypeA} from "../ecs";

export class EventData<T> {
    processed = false;

    currentTarget = this.source;

    constructor(readonly type: string,
                readonly source: Entity,
                readonly payload: T) {

    }
}

export class EventReceiver_Data {
    readonly hub = new SignalMap<EventData<unknown>>();

    emit<T>(data: EventData<T>) {
        this.hub.map.get(data.type)?.emit(data);
    }
}

export const EventReceiver = new ComponentTypeA(EventReceiver_Data);

export function dispatchBroadcast<T>(e: Entity, data: EventData<T>) {
    const receiver = e.tryGet(EventReceiver);
    if (receiver !== undefined) {
        receiver.emit(data);
    }

    let it = e.childFirst;
    while (it !== null) {
        dispatchBroadcast(it, data);
        it = it.siblingNext;
    }
}

export function dispatchBubbling<T>(e: Entity, data: EventData<T>) {
    let it: Entity | null = e;
    while (it !== null && it.isValid) {
        const receiver = it.tryGet(EventReceiver);
        if (receiver !== undefined) {
            receiver.emit(data);
        }
        it = it.parent;
    }
}

export function dispatchBubbling_short<T>(src: Entity, type: string, data?: T) {
    dispatchBubbling(src, new EventData(type, src, data));
}

export function dispatchBroadcast_short<T>(src: Entity, type: string, data?: T) {
    dispatchBroadcast(src, new EventData(type, src, data));
}