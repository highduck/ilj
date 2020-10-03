import {FunctionalComponent, h} from "preact";
import {_componentTypes, _entityComponentList, Entity} from "@highduck/core";
import {BoolField} from "../fields/BoolField";
import {COMPONENTS_CONFIG, ComponentViewConfig} from "./ComponentsConfig";
import {ObjectEditor} from "./ObjectEditor";

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
    const info = `#${e.index} *${e.version}`;
    let els = [
        <div>Name: {e.name ?? ""}</div>,
        <BoolField target={e} field="visible"/>,
        <BoolField target={e} field="touchable"/>,
        <div>{info}</div>,
        <div>Layer Mask: 0x{e.layerMask.toString(16).toUpperCase()}</div>,
        <hr/>
    ];
    const list = _entityComponentList[e.index];
    for (let i = 0; i < list.length; ++i) {
        const compID = list[i];
        const compType = _componentTypes[compID];
        const config = COMPONENTS_CONFIG.get(compType);
        const compData = compType.map.get(e.index);
        let isOpen = openedSet.get(compID) ?? true;
        const openerIcon = isOpen ? '▼' : '►';
        const handleToggle = (ev: MouseEvent) => openedSet.set(compID, !isOpen);
        const enabled = (compData as any).enabled;
        const handleEnabling = (ev: Event) => {
            if (enabled !== undefined) {
                (compData as any).enabled = !enabled;
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
                <b>{getComponentReadableName(compData, config)}</b>
            </div>
        );

        if (isOpen) {
            const viewClass = config?.view ?? ObjectEditor;
            els.push(<div style={{paddingLeft: "20px"}}>
                {
                    h(viewClass, {
                        data: compData,
                        config: config
                    })
                }
            </div>);
        }
        els.push(<hr/>);
    }
    return <div>{els}</div>;
};
