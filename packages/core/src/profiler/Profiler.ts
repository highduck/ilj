import {DevStatGraph} from "./DevStatGraph";
import {StringMap} from "../ds/StringMap";
import {Drawer} from "../drawer/Drawer";
import {FontResource} from "..";

export class Profiler {

    enabled = false;
    readonly graphs = new StringMap<DevStatGraph>();
    readonly groups = new StringMap<number>();
    readonly font = FontResource.get("Comfortaa-Regular");

    constructor() {

    }

    getGraph(name: string): DevStatGraph {
        let f = this.graphs.get(name);
        if (f === undefined) {
            f = new DevStatGraph(name);
            this.graphs.set(name, f);
        }
        return f;
    }

    setFrameGraphValue(name: string, value: number) {
        this.getGraph(name).add(value);
    }

    draw(drawer: Drawer) {
        const e = this.graphs.size;
        const graphs = this.graphs.values;
        for (let i = 0; i < e; ++i) {
            graphs[i].update();
        }

        drawer.state.saveMatrix();
        drawer.state.setEmptyTexture();
        let y = 0;
        for (let i = 0; i < e; ++i) {
            drawer.state.matrix.y = y;
            const graph = graphs[i];
            graph.drawGraph(drawer);
            y += graph.height + 10;
        }
        if (this.font.data !== undefined) {
            y = 0;
            for (let i = 0; i < e; ++i) {
                drawer.state.matrix.y = y;
                const graph = graphs[i];
                graph.drawLabels(this.font.data);
                y += graph.height + 10;
            }
        }
        drawer.state.restoreMatrix();
    }

    wrap(name: string, fn: () => void) {
        this.beginGroup(name);
        fn();
        this.endGroup(name);
    }

    beginGroup(name: string) {
        if (!this.enabled) {
            return;
        }
        this.groups.set(name, performance.now());
    }

    endGroup(name: string) {
        if (!this.enabled) {
            return;
        }
        const ts = this.groups.get(name);
        if (ts !== undefined) {
            const delta = performance.now() - ts;
            this.getGraph(name).add(Math.round(1000 * delta));
        }
    }
}