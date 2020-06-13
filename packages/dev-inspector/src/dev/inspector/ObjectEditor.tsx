import {FunctionalComponent, h} from "preact";
import {GenericField} from "../fields/GenericField";
import {ComponentViewProps} from "./ComponentsConfig";

const IGNORED_FIELDS = ["entity", "enabled"];
const PRIVATE_PREFIX = "_".charCodeAt(0);

export const ObjectEditor: FunctionalComponent<ComponentViewProps> = (props: ComponentViewProps) => {
    const data = props.data;
    const els = [];
    for (const field of Object.keys(data)) {
        if (IGNORED_FIELDS.indexOf(field) !== -1 ||
            PRIVATE_PREFIX === field.charCodeAt(0)) {
            continue;
        }
        els.push(<GenericField data={data} field={field}/>)
    }
    return <div>{els}</div>;
};