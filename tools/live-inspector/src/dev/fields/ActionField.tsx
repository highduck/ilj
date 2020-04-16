import {FunctionalComponent, h} from 'preact';
import {fieldLabel, FieldProps, fieldValue} from "./FieldProps";

type ButtonFieldProps = FieldProps<() => void>;

export const ActionField: FunctionalComponent<ButtonFieldProps> = (props: ButtonFieldProps) => {
    return <input type="button"
               value={fieldLabel(props)}
               onClick={fieldValue(props)}
        />;
};