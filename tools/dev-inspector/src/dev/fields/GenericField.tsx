import {BoolField} from "./BoolField";
import {NumberField} from "./NumberField";
import {Recta, Vec2, Color4} from "@highduck/math";
import {Vec2Field} from "./Vec2Field";
import {RectField} from "./RectField";
import {Color4Field} from "./Color4Field";
import {h} from "preact";
import {ObjectEditor} from "../inspector/ObjectEditor";

interface GenericFieldProps {
    data: object;
    field: string;
}

export const GenericField = ({data, field}: GenericFieldProps) => {
    const val = (data as any)[field];

    if (Array.isArray(val)) {
        return <div>{field}: Array[{(val as Array<unknown>).length}]</div>
    }

    const type = typeof val;
    switch (type) {
        case "boolean":
            return <BoolField target={data} field={field}/>;
        case "number":
            return <NumberField target={data} field={field}/>;
        case "object":
            if (val instanceof Vec2) {
                return <Vec2Field target={data} field={field}/>;
            } else if (val instanceof Recta) {
                return <RectField target={data} field={field}/>;
            } else if (val instanceof Color4) {
                return <Color4Field target={data} field={field}/>;
            } else if (val.toString !== undefined && val.toString() !== "[object Object]") {
                return <div>{field}: {val.toString()}</div>;
            // } else if (val.constructor && val.constructor.name) {
            //     return <div>{field}: [{val.constructor.name}
            //         <div style={{paddingLeft: "20px"}}>
            //             <ObjectEditor data={val}/>
            //         </div>
            //     </div>;
            } else {
                // console.assert(false);
            }
            break;
    }
    // console.assert(false);
    return <div>{field}: {"" + (data as any)[field]}</div>;
};