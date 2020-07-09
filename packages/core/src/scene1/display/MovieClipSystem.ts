import {MovieClip2D} from "./MovieClip2D";
import {getComponents} from "../../ecs/World";

export function updateMovieClips() {
    const movies = getComponents(MovieClip2D);
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