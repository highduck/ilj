import {Entity} from "@highduck/core";
import {Component, h} from "preact";
import {HierarchyItem} from "./HierarchyItem";
import {EditorContext} from "../EditorContext";

interface HierarchyTreeProps {
    root: Entity;
    editor: EditorContext;
}

export class HierarchyTree extends Component<HierarchyTreeProps, {}> {

    opened = new Set<Entity>();

    invalidate() {
        for (const e of this.opened) {
            if (!e.isValid) {
                this.opened.delete(e);
            }
        }
    }

    toggleOpen(e: Entity) {
        if (this.opened.has(e)) {
            this.opened.delete(e);
        } else {
            this.opened.add(e);
        }
    }

    render() {
        this.invalidate();
        return <HierarchyItem entity={this.props.root}
                              parentActive={true}
                              depth={0}
                              tree={this}
                              editor={this.props.editor}/>
    }
}