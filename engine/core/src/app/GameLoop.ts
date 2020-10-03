import {Signal} from "../util/Signal";

export const GameLoop = new Signal<number>();

const RAF = (timestamp: number) => {
    request = requestAnimationFrame(RAF);
    GameLoop.emit(timestamp);
}
let request = requestAnimationFrame(RAF);