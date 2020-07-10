import {FunctionalComponent, h} from "preact";
import {Entity} from "@highduck/core";
import {BoolField} from "../fields/BoolField";
import {COMPONENTS_CONFIG, ComponentViewConfig} from "./ComponentsConfig";
import {ObjectEditor} from "./ObjectEditor";
import {ComponentClass} from "@highduck/core";

interface EntityInspectorProps {
    entity: undefined | Entity;
}

function getComponentIcon(config?: ComponentViewConfig) {
    return config !== undefined ? (config.icon !== undefined ? config.icon : '🔍') : '🕵';
}

function getComponentReadableName(comp: object, config?: ComponentViewConfig) {
    return config && config.name ? config.name : comp.constructor.name;
}

const openedSet = new Map<number, boolean>();

export const EntityInspector: FunctionalComponent<EntityInspectorProps> = (props: EntityInspectorProps) => {
    if (!props.entity || !props.entity.isValid) {
        return null;
    }
    const e = props.entity;
    const info = `#${e.passport.toString(16)} (IDX: ${e.passport & 0xFFFFF}; VER: ${e.passport >>> 20})`;
    let els = [
        <div>Name: {e.name ?? ""}</div>,
        <BoolField target={e} field="visible"/>,
        <BoolField target={e} field="touchable"/>,
        <div>{info}</div>,
        <div>Layer Mask: 0x{e.layerMask.toString(16).toUpperCase()}</div>,
        <hr/>
    ];
    for (let comp of e.components.values) {
        const type = comp.constructor as ComponentClass;
        const config = COMPONENTS_CONFIG.get(type);
        let isOpen = openedSet.get(type.COMP_ID) ?? true;
        const openerIcon = isOpen ? '▼' : '►';
        const handleToggle = (ev: MouseEvent) => openedSet.set(type.COMP_ID, !isOpen);
        const enabled = (comp as any).enabled;
        const handleEnabling = (ev: Event) => {
            if (enabled !== undefined) {
                (comp as any).enabled = !enabled;
            }
            ev.stopImmediatePropagation();
        };
        els.push(
            <div class="noselect" onDblClick={handleToggle}>
                <span style={{
                    display: "inline-block",
                    width: "16px"
                }} onClick={handleToggle}>{openerIcon}</span>
                <span>{getComponentIcon(config)}</span>
                <input type="checkbox"
                       disabled={enabled === undefined}
                       checked={enabled === undefined || enabled}
                       onInput={handleEnabling}
                />
                <span>{config && config.kind ? ("[" + config.kind + "] ") : ""}</span>
                <b>{getComponentReadableName(comp, config)}</b>
            </div>
        );

        if (isOpen) {
            const viewClass = config?.view ?? ObjectEditor;
            els.push(<div style={{paddingLeft: "20px"}}>
                {
                    h(viewClass, {
                        data: comp,
                        config: config
                    })
                }
            </div>);
        }
        els.push(<hr/>);
    }
    return <div>{els}</div>;
};
