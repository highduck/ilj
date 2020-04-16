import {FunctionalComponent, h} from 'preact';
import {fieldLabel, FieldProps, fieldValue} from "./FieldProps";

type BoolFieldProps = FieldProps<boolean>;

export const BoolField: FunctionalComponent<BoolFieldProps> = (props: BoolFieldProps) => {
    const changed = (ev: Event) =>
        fieldValue(props, (ev.target as HTMLInputElement).checked);

    return <label class="noselect" style="display:block">
        <input type="checkbox"
               checked={fieldValue(props)}
               onInput={changed}/>
        {fieldLabel(props)}
    </label>;
};