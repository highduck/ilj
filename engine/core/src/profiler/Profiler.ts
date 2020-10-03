import {DevStatGraph} from "./DevStatGraph";
import {StringMap} from "../ds/StringMap";
import {Drawer} from "../drawer/Drawer";
import {ECS_getUsedCount, FontResource} from "..";
import {FPSMeter} from "./FPSMeter";

const frameBudgetMillis = 1000.0 / 60.0;

export class Profiler {
    readonly graphs = new StringMap<DevStatGraph>();
    readonly groups = new StringMap<number>();
    readonly font = FontResource.get("Comfortaa-Regular");
    readonly fps = new FPSMeter();

    readonly FPS = this.getGraph('FPS');
    readonly DC = this.getGraph('DC');
    readonly TRIS = this.getGraph('TRI');
    readonly ENTITIES = this.getGraph('entities');
    enabled = false;

    constructor(readonly drawer: Drawer) {
        this.FPS.threshold = 30;
        this.DC.threshold = 10;
        this.TRIS.threshold = 1000;
        this.ENTITIES.threshold = 500;
    }

    updateProfiler(elapsedTime: number) {
        if (process.env.NODE_ENV === 'development') {
            this.fps.calcFPS(elapsedTime);
        }
        if (elapsedTime > 0.0) {
            this.FPS.add(Math.round(1.0 / elapsedTime) | 0);
        }
        const gr = this.drawer.batcher.graphics;
        this.DC.add(gr.drawCalls);
        this.TRIS.add(gr.triangles);
        this.ENTITIES.add(ECS_getUsedCount());
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

    draw() {
        const e = this.graphs.size;
        const graphs = this.graphs.values;
        // for (let i = 0; i < e; ++i) {
        //     graphs[i].update();
        // }

        const drawer = this.drawer;
        drawer.state.saveMatrix().setEmptyTexture();
        const m = drawer.state.matrix;
        let y = 0;
        for (let i = 0; i < e; ++i) {
            m.y = y;
            const graph = graphs[i];
            graph.drawBackground(drawer);
            if (graph.delta > 0) {
                graph.drawGraph(drawer);
            }
            y += graph.height + 10;
        }
        if (this.font.data !== null) {
            y = 0;
            for (let i = 0; i < e; ++i) {
                m.y = y;
                const graph = graphs[i];
                graph.drawLabels(this.font.data);
                graph.drawLabelCurrent(this.font.data);
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
            const frameGraph = this.getGraph(name);
            frameGraph.add(Math.round(100.0 * delta / frameBudgetMillis) | 0);
            frameGraph.threshold = 100;
        }
    }
}