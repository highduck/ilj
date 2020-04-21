import {Component, h} from 'preact';
import {fieldLabel, FieldProps, fieldValue} from "./FieldProps";

interface NumberBoxProps extends FieldProps<number> {
    min?: number;
    max?: number;
    step?: number;
}

interface NumberBoxState {
    value?: string;
    focused: boolean;
}

export class NumberBox extends Component<NumberBoxProps, NumberBoxState> {
    constructor() {
        super();
        this.state = {
            value: undefined,
            focused: false
        };
    }

    render(props: NumberBoxProps, state: NumberBoxState) {
        const changed = (ev: Event) => {
            const text = (ev.target as HTMLInputElement).value;
            this.setState({value: text});
            const v = parseFloat(text);
            if (v != null && !isNaN(v)) {
                fieldValue(this.props, v);
            }
        };
        let val: string = fieldValue(this.props);
        if (state.value != null && state.focused) {
            val = state.value;
        }

        return <label class="noselect" style="display:flex;align-items:center;">
            <small style={{paddingRight: "5px", paddingLeft: "5px"}}>{fieldLabel(props)}</small>
            <input style={{
                flex: 1,
                width: "90%",
                "max-width": "100px"
            }}
                   type="number"
                   onInput={changed}
                   min={props.min}
                   max={props.max}
                   step={props.step ?? 0.01}
                   value={val}
                   onFocus={() => this.setState({focused: true})}
                   onBlur={() => this.setState({focused: false})}
            />
        </label>;
    }
}