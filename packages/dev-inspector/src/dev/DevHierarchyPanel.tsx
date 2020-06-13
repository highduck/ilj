import LayoutManager from '../goldenlayout/importGoldenLayout';
import {h} from "preact";
import {HierarchyTree} from "./hierarchy/HierarchyTree";
import {DevApp} from "../DevApp";
import {DevPanel} from "./DevPanel";
import {Engine} from "@highduck/core";

export class DevHierarchyPanel extends DevPanel {

    constructor(readonly container: LayoutManager.Container) {
        super(container);
    }

    render(app: DevApp) {
        const engine = Engine.current;
        return <HierarchyTree editor={app.editor}
                              root={engine.root}/>;
    }
}
