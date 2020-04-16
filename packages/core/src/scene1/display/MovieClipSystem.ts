import {Engine} from "../../Engine";
import {MovieClip2D} from "./MovieClip2D";

export function updateMovieClips() {
    const engine = Engine.current;
    for (const mov of engine.world.query(MovieClip2D)) {
        if (mov.playing) {
            mov._time += mov.entity.dt * mov.fps;
            mov.dirty = true;
        }
        if (mov.dirty) {
            const data = mov.getMovieClipData();
            if (data !== undefined) {
                mov.truncTime(data);
                mov.applyFrameData(data);
            }
            mov.dirty = false;
        }
    }
}