import {FunctionalComponent, h} from "preact";
import {ComponentViewProps} from "./ComponentsConfig";
import {Transform2D_Data} from "@highduck/core";
import {Vec2Field} from "../fields/Vec2Field";
import {NumberField} from "../fields/NumberField";
import {RectField} from "../fields/RectField";
import {Color4Field} from "../fields/Color4Field";

export const Transform2DEditor: FunctionalComponent<ComponentViewProps> = (props: ComponentViewProps) => {
    const data = props.data as Transform2D_Data;
    return <div>
        <Vec2Field label="Position" target={data} field="position"/>
        <Vec2Field label="Scale" target={data} field="scale"/>
        <Vec2Field label="Skew" target={data} field="skew"/>
        <NumberField label="Rotation" target={data} field="rotation"/>
        <Vec2Field label="Origin" target={data} field="origin"/>
        <Vec2Field label="Pivot" target={data} field="pivot"/>
        <RectField label="Canvas" target={data} field="rect"/>
        <NumberField label="Alpha" target={data.colorMultiplier} field="a" min={0} max={1}/>
        <Color4Field label="Color Multip" target={data} field="colorMultiplier"/>
        <NumberField label="Additive" target={data.colorOffset} field="a" min={0} max={1}/>
        <Color4Field label="Color Offset" target={data} field="colorOffset"/>
    </div>
};