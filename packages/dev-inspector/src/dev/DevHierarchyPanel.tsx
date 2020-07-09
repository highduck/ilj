import LayoutManager from '../goldenlayout/importGoldenLayout';
import {h} from "preact";
import {HierarchyTree} from "./hierarchy/HierarchyTree";
import {DevApp} from "../DevApp";
import {DevPanel} from "./DevPanel";
import {Entity} from "@highduck/core";

export class DevHierarchyPanel extends DevPanel {

    constructor(readonly container: LayoutManager.Container) {
        super(container);
    }

    render(app: DevApp) {
        return <HierarchyTree editor={app.editor}
                              root={Entity.root}/>;
    }
}
