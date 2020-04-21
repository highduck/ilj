import {declTypeID} from "../util/TypeID";
import {SignalMap} from "../util/SignalMap";
import {Entity} from "../ecs/Entity";

export class EventData<T> {
    processed = false;

    constructor(readonly type: string,
                readonly source: Entity,
                readonly payload: T) {

    }
}

export class EventReceiver {
    static TYPE_ID = declTypeID();

    readonly hub = new SignalMap<EventData<unknown>>();

    emit<T>(data: EventData<T>) {
        this.hub.get(data.type).emit(data);
    }
}


export function dispatchBroadcast<T>(e: Entity, data: EventData<T>) {
    const receiver = e.tryGet(EventReceiver);
    if (receiver !== undefined) {
        receiver.emit(data);
    }

    let it = e.childFirst;
    while (it !== undefined) {
        dispatchBroadcast(it, data);
        it = it.siblingNext;
    }
}

export function dispatchBubbling<T>(e: Entity, data: EventData<T>) {
    let it: Entity | undefined = e;
    while (it !== undefined && it.isValid) {
        const receiver = e.tryGet(EventReceiver);
        if (receiver !== undefined) {
            receiver.emit(data);
        }
        it = it.parent;
    }
}