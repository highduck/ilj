import {Component, h} from "preact";
import {HierarchyTree} from "./HierarchyTree";
import {EditorContext} from "../EditorContext";
import {COMPONENTS_CONFIG, COMPONENTS_SEVERITY} from "../inspector/ComponentsConfig";
import {Entity} from "@highduck/core";

interface HierarchyItemProps {
    entity: Entity;
    depth: number;
    parentActive: boolean;
    tree: HierarchyTree;
    editor: EditorContext;
}

function getEntityIcon(e: Entity): string {
    let icon: string | undefined = undefined;
    let idx = -1;
    for (const type of COMPONENTS_CONFIG.keys()) {
        const v = COMPONENTS_CONFIG.get(type);
        if (v !== undefined && v.icon !== undefined) {
            const comp = e.tryGet(type);
            if (comp !== undefined && (comp.constructor) === type.ctor) {
                const sev = COMPONENTS_SEVERITY.indexOf(type);
                if (sev >= idx) {
                    idx = sev;
                    icon = v.icon;
                }
            }
        }
    }
    if (icon === undefined) {
        icon = (e.childFirst !== undefined) ? "📦" : "🗒";
    }
    return icon;
}

export class HierarchyItem extends Component<HierarchyItemProps, {}> {

    render(props: HierarchyItemProps) {
        const e: Entity = props.entity;
        if (!e || !e.isValid) {
            return;
        }
        const hasChildren = e.childFirst !== undefined;
        const onUpdate = (ev: Event) => {
            e.visible = (ev.target as HTMLInputElement).checked;
        };
        const worldActive = props.parentActive && e.visible;
        const isRoot = e === Entity.root;
        const isOpen = props.tree.opened.has(e) || isRoot;
        const isSelected = props.editor.selected === e;

        const prefix = isRoot ? "#" : (hasChildren ? (isOpen ? '▼' : '►') : '┣');

        const depth = this.props.depth;
        const indent = depth * 15;
        let typeIcon = getEntityIcon(e);

        const toggleOpen = (event: MouseEvent) => {
            props.tree.toggleOpen(e);
            event.stopImmediatePropagation();
        };

        const select = (event: MouseEvent) => {
            props.editor.selected = e;
            event.stopImmediatePropagation();
        };

        let els = [
            <div class="noselect" style={{
                clear: "right",
                "padding-left": `${indent}px`,
                opacity: worldActive ? 1 : 0.5,
                "background-color": isSelected ? "#036" : "inherit",
                display: "block"
            }} onDblClick={toggleOpen} onClick={select}>
                <span style={{display: "inline-block", width: "14px"}} onClick={toggleOpen}>
                    {prefix}
                </span>
                <span style={{display: "inline-block", width: "20px"}}>
                    {typeIcon}
                </span>
                <span style={e.name == null ? {
                    color: "gray"
                } : {}}>
                    {e.toString()}
                </span>
                <span style={{
                    float: "right"
                }}>
                    <input style={{
                        marginRight: "20px"
                    }}
                           type="checkbox"
                           checked={e.visible}
                           onInput={onUpdate}/>
                </span>
            </div>
        ];
        if (hasChildren && isOpen) {
            let it = e.childFirst;
            while (it !== undefined) {
                els.push(<HierarchyItem entity={it}
                                        depth={depth + 1}
                                        parentActive={worldActive}
                                        tree={props.tree}
                                        editor={props.editor}/>);
                it = it.siblingNext;
            }
        }
        return els;
    }

}