import LayoutManager from '../goldenlayout/importGoldenLayout';
import {DevApp} from "../DevApp";

export class DevGamePanel {
    canvas: HTMLCanvasElement;

    constructor(readonly container: LayoutManager.Container) {
        container.on("resize", () => this.resize());
        container.on("open", () => this.open());
        container.on("destroy", () => this.destroy());
        this.canvas = DevApp.CURRENT.engine.view.canvas;
    }

    resize() {
        this.canvas.dispatchEvent(new Event("resize"));
    }

    open() {

        const parent = this.canvas.parentNode;
        if (parent) {
            if(parent.parentNode) {
                parent.parentNode.removeChild(parent);
            }
            const dom = this.container.getElement().get(0);
            if(dom) {
                dom.appendChild(parent);
                this.resize();
            }
        }
    }

    destroy() {
        this.container.off("resize");
        this.container.off("open");
        this.container.off("destroy");
    }
}