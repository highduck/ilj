import {FunctionalComponent, h} from "preact";
import {DevApp} from "../DevApp";

export const DevToolbar: FunctionalComponent = () => {
    const onClick = () => {
        const root = DevApp.layout.root;
        const item = root.getItemsById("StatsPanel");
        if (item.length > 0) {
            item[0].select();
        } else {
            root.getItemsById('main')[0].addChild({
                type: 'component',
                componentName: 'StatsPanel',
                id: 'StatsPanel',
            });
        }
    };
    return <div>
        <input value="Stats" type="button" onClick={onClick}/>
    </div>;
};
