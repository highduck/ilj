import {FunctionalComponent, h} from 'preact';
import {fieldLabel, FieldProps, fieldValue} from "./FieldProps";
import {NumberField} from "./NumberField";
import {Color4} from "@highduck/math";

type Color4FieldProps = FieldProps<Color4>;

export const Color4Field: FunctionalComponent<Color4FieldProps> = (props: Color4FieldProps) => {
    const v = fieldValue(props);
    const size = "width:60px;height:30px;";
    const sizeb = "width:50px;height:20px;";
    const checkerboard = `${size}background-color:#eee;
    background-image:linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black),
    linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black);
    background-size:10px 10px;background-position:0 0,5px 5px;`;
    const color = `position:relative;left:0;top:-30px;${sizeb}
    background-color:${v.css};border:5px solid ${v.cssRGB};`;
    return <div style="display:flex;">
        <span class="noselect" style={{flex:1, flexShrink:0}}>
            {fieldLabel(props)}
            <div style={checkerboard}></div>
            <div style={color}></div>
        </span>
        <div style="display:flex;flex-direction:column;">
            <NumberField label="A:" target={v} field="a" min={0} max={1}/>
            <NumberField label="R:" target={v} field="r" min={0} max={1}/>
            <NumberField label="G:" target={v} field="g" min={0} max={1}/>
            <NumberField label="B:" target={v} field="b" min={0} max={1}/>
        </div>
    </div>;
};