import LayoutManager from '../goldenlayout/importGoldenLayout';
import {h} from "preact";
import {EntityInspector} from "./inspector/EntityInspector";
import {DevApp} from "../DevApp";
import {DevPanel} from "./DevPanel";

export class DevInspectorPanel extends DevPanel {
    constructor(readonly container: LayoutManager.Container) {
        super(container);
    }

    render(app: DevApp) {
        return <EntityInspector entity={app.editor.selected}/>;
    }
}