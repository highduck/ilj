import {Component, h} from 'preact';
import {fieldLabel, FieldProps, fieldTag, fieldValue} from "./FieldProps";

interface NumberFieldProps extends FieldProps<number> {
    min?: number;
    max?: number;
    step?: number;
}

interface NumberFieldState {
    value?: string;
    focusSlider: boolean;
    focusText: boolean;
}

export class NumberField extends Component<NumberFieldProps, NumberFieldState> {
    constructor() {
        super();
        this.state = {
            focusSlider: false,
            focusText: false
        };
    }

    render(props: NumberFieldProps, state: NumberFieldState) {
        const changed = (ev: Event) => {
            const text = (ev.target as HTMLInputElement).value;
            this.setState({value: text});
            const v = parseFloat(text);
            if (v != null && !isNaN(v)) {
                fieldValue(this.props, v);
            }
        };
        // class="slider"
        let val: string = fieldValue(this.props);
        if (state.value != null && (state.focusSlider || state.focusText)) {
            val = state.value;
        }
        const hasSlider = props.min !== undefined && props.max !== undefined;

//justify-content:flex-end;
        return <div style="display:flex;align-items:center;">
            <span class="noselect" style={{flex: hasSlider ? 1 : 0.5}}>{fieldLabel(props)}</span>
            {
                hasSlider ?
                    <input style="padding:0;margin:8;border:0;flex:1;width:100%;"
                           type="range"
                           onInput={changed}
                           min={props.min}
                           max={props.max}
                           step={props.step ?? 0.01}
                           value={val}
                           onFocus={() => this.setState({focusSlider: true})}
                           onBlur={() => this.setState({focusSlider: false})}
                    /> : {}
            }
            <input style={{
                flex: hasSlider ? 0.5 : 1,
                width: "100%",
                "max-width": "100px"
            }}
                   type="number"
                   onInput={changed}
                   min={props.min}
                   max={props.max}
                   step={props.step ?? 0.01}
                   value={val}
                   onFocus={() => this.setState({focusText: true})}
                   onBlur={() => this.setState({focusText: false})}
            />
        </div>;
    }
}