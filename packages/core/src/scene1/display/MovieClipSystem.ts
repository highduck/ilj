import {MovieClip2D} from "./MovieClip2D";
import {EntityMap} from "../../ecs";

export function updateMovieClips() {
    const movies = MovieClip2D.map.values;
    const entities = MovieClip2D.map.keys;
    for (let i = 0; i < movies.length; ++i) {
        const mov = movies[i];
        if (mov.playing) {
            mov._time += mov.timer.dt * mov.fps;
            mov.dirty = true;
        }
        if (mov.dirty) {
            const data = mov.getMovieClipData();
            if (data !== undefined) {
                const entity = EntityMap.get(entities[i])!;
                mov.truncTime(data);
                mov.applyFrameData(entity, data);
            }
            mov.dirty = false;
        }
    }
}