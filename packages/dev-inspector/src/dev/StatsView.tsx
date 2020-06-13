import {FunctionalComponent, h} from "preact";
import {Engine} from "@highduck/core";
import {BoolField} from "./fields/BoolField";
import {ActionField} from "./fields/ActionField";
import {NumberField} from "./fields/NumberField";
import {ObjectEditor} from "./inspector/ObjectEditor";

export const StatsView: FunctionalComponent<{}> = (props: {}) => {
    const engine = Engine.current;
    return <div>
        <div><b>FPS: </b>{engine.fps.avg}</div>
        <div><b>TRI: </b>{engine.graphics.triangles}</div>
        <div><b>DC: </b>{engine.graphics.drawCalls}</div>
        <div>
            <b>t: </b>{engine.time.ts.toFixed(2)}
            <b> l: </b>{engine.time.total.toFixed(2)}
            <b> n: </b>{engine.time.index}
        </div>
        <div><b>Objects: </b>{engine.world.size}</div>
        <div><b>Maps: </b>{engine.world.maps.size}</div>
        <div><b>Locator: </b>{engine.services.size}</div>

        <BoolField target={engine}
                   field="running"/>
        <ActionField label="Step"
                     target={engine}
                     field="_step"/>
        <NumberField label="Time Scale"
                     target={engine.time}
                     field="scale"
                     min={0}
                     max={10}/>
        {
            engine.variables.map(data => <ObjectEditor data={data}/>)
        }

    </div>;
};