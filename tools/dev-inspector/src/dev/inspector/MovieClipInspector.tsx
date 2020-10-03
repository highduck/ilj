import {MovieClip2D_Data} from "@highduck/core";
import {BoolField} from "../fields/BoolField";
import {NumberField} from "../fields/NumberField";
import {FunctionalComponent, h} from "preact";
import {ComponentViewProps} from "./ComponentsConfig";

export const MovieClipInspector: FunctionalComponent<ComponentViewProps> = (props: ComponentViewProps) => {
    const mc = props.data as MovieClip2D_Data;
    return <div>
        <NumberField target={mc}
                     field="fps"
                     min={0}
                     max={200}
                     step={1}
        />
        <NumberField target={mc}
                     field="time"
                     min={0}
                     max={mc.timeMax}
                     step={0.1}/>
        <BoolField target={mc} field="playing"/>
    </div>
};
