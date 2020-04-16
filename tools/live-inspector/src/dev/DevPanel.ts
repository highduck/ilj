import LayoutManager from '../goldenlayout/importGoldenLayout';
import {DevApp} from "../DevApp";
import {ComponentChild, render} from "preact";

export class DevPanel {

    get dom() {
        return this.container.getElement().get(0);
    }

    _handleRender = (app: DevApp) => this.handleRender(app);

    constructor(readonly container: LayoutManager.Container) {
        this.container.getElement()
            .addClass("dev")
            .css("overflow-y", "visible");
        container.layoutManager.eventHub.on("render", this._handleRender);
        container.on("destroy", () => this.destroy());
    }

    handleRender(app: DevApp) {
        render(this.render(app), this.dom);
    }

    render(app: DevApp): ComponentChild {
        return undefined;
    }

    destroy() {
        this.container.layoutManager.eventHub.off("render", this._handleRender);
        this.container.off("destroy");
    }
}