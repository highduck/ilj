import {FunctionalComponent, h} from 'preact';
import {fieldLabel, FieldProps, fieldValue} from "./FieldProps";
import {Rect} from "@highduck/math";
import {NumberBox} from "./NumberBox";

type RectFieldProps = FieldProps<Rect>;

export const RectField: FunctionalComponent<RectFieldProps> = (props: RectFieldProps) => {
    const v = fieldValue(props);
    return <div style="display:flex;">
        <span class="noselect" style="flex:1;">
            {fieldLabel(props)}
        </span>
        <div style="display:flex;flex-direction:column;">
            <div style="flex:1;display:flex;align-items:center;">
                <NumberBox label="X:" target={v} field="x"/>
                <NumberBox label="Y:" target={v} field="y"/>
            </div>
            <div style="flex:1;display:flex;align-items:center;">
                <NumberBox label="W:" target={v} field="width" min={0}/>
                <NumberBox label="H:" target={v} field="height" min={0}/>
            </div>
        </div>
    </div>;
};