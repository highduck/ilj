import {Engine} from "../../Engine";
import {MovieClip2D} from "./MovieClip2D";

export function updateMovieClips() {
    const engine = Engine.current;
    const movies = engine.world.components(MovieClip2D);
    for (let i = 0; i < movies.length; ++i) {
        const mov = movies[i];
        if (mov.playing) {
            mov._time += mov.timer.dt * mov.fps;
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