import {FunctionalComponent, h} from 'preact';
import {fieldLabel, FieldProps, fieldValue} from "./FieldProps";
import {Vec2} from "@highduck/math";
import {NumberBox} from "./NumberBox";

type Vec2FieldProps = FieldProps<Vec2>;

export const Vec2Field: FunctionalComponent<Vec2FieldProps> = (props: Vec2FieldProps) => {
    const v = fieldValue(props);
    return <div class="noselect" style={{display: 'flex', alignItems: 'center'}}>
         <span style={{flexShrink: 0, flexWrap:'nowrap', width: "35%", minWidth:"100px", whiteSpace:"nowrap"}}>
           {fieldLabel(props)}
         </span>
        <NumberBox label="X:" target={v} field="x"/>
        <NumberBox label="Y:" target={v} field="y"/>
    </div>
};