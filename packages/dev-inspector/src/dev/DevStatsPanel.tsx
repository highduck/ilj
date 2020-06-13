import LayoutManager from '../goldenlayout/importGoldenLayout';
import {h} from "preact";
import {StatsView} from "./StatsView";
import {DevApp} from "../DevApp";
import {DevPanel} from "./DevPanel";

export class DevStatsPanel extends DevPanel {
    constructor(readonly container: LayoutManager.Container) {
        super(container);
    }

    render(app: DevApp) {
        return <StatsView/>;
    }
}