import {Engine} from "@highduck/core";
import {h, render} from "preact";
import {EditorContext} from "./dev/EditorContext";

import {DevGamePanel} from "./dev/DevGamePanel";
import {DevStatsPanel} from "./dev/DevStatsPanel";
import {DevHierarchyPanel} from "./dev/DevHierarchyPanel";
import {DevInspectorPanel} from "./dev/DevInspectorPanel";
import {DevToolbar} from "./dev/DevToolbar";
import LayoutManager from './goldenlayout/importGoldenLayout';
import './dev.css';

const config: any = {
    settings: {
        //showPopoutIcon: false
        selectionEnabled: true
    },
    content: [{
        id: 'main',
        type: 'row',
        header: {
            popout: false,
        },
        content: [
            {
                type: 'column',
                content: [
                    {
                        type: 'component',
                        componentName: 'HierarchyPanel',
                    },
                    {
                        id: 'StatsPanel',
                        type: 'component',
                        componentName: 'StatsPanel',
                    },
                ]
            },
            {
                type: 'stack',
                header: {
                    show: "top"
                },
                width: 70,
                content: [
                    {
                        type: 'component',
                        componentName: 'GamePanel',
                        isClosable: false,

                        // header : {
                        //     show: false | 'top' | 'left' | 'right' | 'bottom'
                        //     maximize : false | 'custom label',
                        //     minimize :  'custom label',
                        //     popout :  false | 'custom label',
                        //     close: 'custom label',
                        // }
                        header: {
                            //     show: "top",
                            popout: false,
                        }
                    },
                ]
            },
            {
                type: 'column',
                content: [
                    {
                        type: 'component',
                        componentName: 'InspectorPanel'
                    },
                ]
            },
        ]
    }]
};

function createLayout(): LayoutManager {
    const vdom = <article id="app" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }}>
        <header id="toolbar" style={{
            flex: '0 1 20px'
        }}/>
        <section id="main-dock" style={{
            flex: 1,
            overflow: 'hidden'
        }}/>
        <footer id="statusbar" style={{
            flex: '0 1 20px'
        }}/>
    </article>;
    render(vdom, document.body);

    const el = document.getElementById('main-dock') as HTMLElement;
    const layout = new LayoutManager(config, el);
    layout.registerComponent("GamePanel", DevGamePanel);
    layout.registerComponent("StatsPanel", DevStatsPanel);
    layout.registerComponent("HierarchyPanel", DevHierarchyPanel);
    layout.registerComponent("InspectorPanel", DevInspectorPanel);
    layout.init();

    const resizeLayout = () => layout.updateSize();
    window.addEventListener('orientationchange', resizeLayout, false);
    window.addEventListener('resize', resizeLayout, false);
    resizeLayout();

    return layout;
}

export class DevApp {

    static CURRENT: DevApp;
    static layout: LayoutManager;

    readonly editor = new EditorContext();
    readonly updateRate = 100;

    static init() {
        DevApp.layout = createLayout();
        new DevApp();
    }

    constructor() {
        DevApp.CURRENT = this;

        render(<DevToolbar/>, document.getElementById("toolbar") as HTMLElement);

        this.update = this.update.bind(this);
        setTimeout(this.update, this.updateRate);
    }

    update() {
        this.editor.invalidate();

        DevApp.layout.eventHub.emit("render", this);

        setTimeout(this.update, this.updateRate);
    }
}
