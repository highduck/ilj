import {TransformModel} from "./TransformModel";
import {BoundsBuilder, Vec2} from "@highduck/math";
import {RenderCommand} from "./RenderCommand";
import {Element} from "../xfl/types";
import {RenderBatch} from "./RenderBatch";
import {RenderOp} from "./RenderOp";
import {ShapeEdge} from "./ShapeEdge";
import {EdgeSelectionBit} from "../xfl/parseEdges";

const enum CommandSymbol {
    MOVE_TO = 0, // '!'
    LINE_TO = 1, // '|'
    LINE_TO_ = 2, // '/'
    CURVE_TO = 3, // '['
    CURVE_TO_ = 4, // ']',
    SELECT = 5, // 'S'
}

export class ShapeDecoder {
    readonly transform = new TransformModel()
    readonly boundsBuilder = new BoundsBuilder();
    total = 0;

    commands: RenderCommand[] = [];
    fill_styles: RenderCommand[] = [];
    line_styles: RenderCommand[] = [];

    constructor(transform: TransformModel) {
        this.transform.copyFrom(transform);
    }

    decode(el: Element) {
        ++this.total;

        const matrix = this.transform.matrix;

        this.read_fill_styles(el);
        this.read_line_styles(el);

        const pen = new Vec2(0, 0);

        let current_fill_0 = 0;
        let current_fill_1 = 0;
        let current_line = -1;

        const edges: RenderCommand[] = [];
        let fills: ShapeEdge[] = [];
        let back_fills: ShapeEdge[] = [];

        for (const edge of el.edges) {
            let line_started = false;
            const edgeCommands = edge.commands;
            const values = edge.values;
            if (edgeCommands.length === 0) {
                continue;
            }

            back_fills = [];

            const is_new_line_style = edge.stroke_style !== current_line;
            current_fill_0 = edge.fill_style_0;
            current_fill_1 = edge.fill_style_1;

            let radius = 0;

            if (is_new_line_style) {
                const line_style_idx = edge.stroke_style;
                edges.push(this.line_styles[line_style_idx]);
                current_line = line_style_idx;

                radius = line_style_idx < 1 ? 0 : (el.strokes[line_style_idx - 1].solid.weight / 2);
            }

            let valueIndex = 0;

            for (const cmd of edgeCommands) {
                if (cmd === CommandSymbol.MOVE_TO) {
                    const v1 = values[valueIndex++];
                    const v2 = values[valueIndex++];
                    const p = new Vec2();
                    matrix.transform(v1, v2, p);

                    //if (px != penX || py != penY) {
                    if (current_line > 0 && !(line_started && pen.equals(p))) {
                        this.extend(p.x, p.y, radius);
                        edges.push(new RenderCommand(RenderOp.move_to, p.x, p.y));
                        line_started = true;
                    }
                    //}

                    pen.copyFrom(p);
                } else if (cmd === CommandSymbol.LINE_TO || cmd === CommandSymbol.LINE_TO_) {
                    const v1 = values[valueIndex++];
                    const v2 = values[valueIndex++];

                    const p = new Vec2();
                    matrix.transform(v1, v2, p);
                    this.extend(p.x, p.y, radius);

                    if (current_line > 0) {
                        edges.push(new RenderCommand(RenderOp.line_to, p.x, p.y));
                    } else {
                        edges.push(new RenderCommand(RenderOp.move_to, p.x, p.y));
                    }

                    if (current_fill_0 > 0) {
                        fills.push(ShapeEdge.line(current_fill_0, pen, p));
                    }

                    if (current_fill_1 > 0) {
                        fills.push(ShapeEdge.line(current_fill_1, p, pen));
                    }

                    pen.copyFrom(p);
                } else if (cmd === CommandSymbol.CURVE_TO || cmd === CommandSymbol.CURVE_TO_) {
                    const v1 = values[valueIndex++];
                    const v2 = values[valueIndex++];
                    const v3 = values[valueIndex++];
                    const v4 = values[valueIndex++];
                    const c = new Vec2();
                    const p = new Vec2();
                    matrix.transform(v1, v2, c);
                    matrix.transform(v3, v4, p);

                    this.extend(c.x, c.y, radius);
                    this.extend(p.x, p.y, radius);

                    if (current_line > 0) {
                        edges.push(new RenderCommand(RenderOp.curve_to, c.x, c.y, p.x, p.y));
                    }

                    if (current_fill_0 > 0) {
                        fills.push(ShapeEdge.curve(current_fill_0, pen, c, p));
                    }

                    if (current_fill_1 > 0) {
                        fills.push(ShapeEdge.curve(current_fill_1, p, c, pen));
                    }

                    pen.copyFrom(p);
                } else if (cmd === CommandSymbol.SELECT) {
                    const mask = values[valueIndex++];
                    // fillStyle0
                    if ((mask & EdgeSelectionBit.FillStyle0) !== 0) {
                        // todo:
                    }
                    // fillStyle1
                    if ((mask & EdgeSelectionBit.FillStyle1) !== 0) {
                        // todo:
                    }
                    // stroke
                    if ((mask & EdgeSelectionBit.Stroke) !== 0) {
                        // todo:
                    }
                }
            }
            fills = fills.concat(back_fills);
        }
        this.flush_commands(edges, fills);
    }

    getResult(): RenderBatch {
        const res = new RenderBatch();
        res.transform.copyFrom(this.transform);
        res.bounds.copyFrom(this.boundsBuilder);
        res.total = this.total;
        res.commands = this.commands.concat();
        return res;
    }

    get empty(): boolean {
        return this.total === 0 || this.boundsBuilder.empty;
    }

    private extend(x: number, y: number, r: number) {
        this.boundsBuilder.addBounds(x - r, y - r, x + r, y + r);
    }

    private read_fill_styles(el: Element) {
        const result: RenderCommand[] = [];

        // Special null fill-style
        result.push(new RenderCommand(RenderOp.fill_end));

        for (const fill of el.fills) {
            const cmd = new RenderCommand(RenderOp.fill_begin);
            cmd.fill = fill;
            result.push(cmd);
        }

        this.fill_styles = result;
    }

    private read_line_styles(el: Element) {
        const result: RenderCommand[] = [];

        // Special null line-style
        result.push(new RenderCommand(RenderOp.line_style_reset));

        for (const stroke of el.strokes) {
            if (stroke.isSolid) {
                const cmd = new RenderCommand(RenderOp.line_style_setup);
                cmd.stroke = stroke;
                result.push(cmd);
            } else {
                /// TODO: check if not solid stroke
            }
        }
        this.line_styles = result;
    }

    private flush_commands(edges: RenderCommand[], fills: ShapeEdge[]) {
        let left = fills.length;
//        bool init = false;
        let current_fill = 0;
        while (left > 0) {
            let first = fills[0];
            let found_fill = false;
            if (current_fill > 0) {
                for (let i = 0; i < left; ++i) {
                    if (fills[i].fill_style_idx == current_fill) {
                        first = fills[i];
                        fills.splice(i, 1);
                        --left;
                        found_fill = true;
                        break;
                    }
                }
            }
            if (!found_fill) {
                fills[0] = fills[--left];
            }
            if (first.fill_style_idx >= this.fill_styles.length) {
                console.warn(`Fill Style ${first.fill_style_idx} not found`);
                continue;
            }

//          if (!init) {
//              init = true;
            if (current_fill !== first.fill_style_idx) {
                this.commands.push(this.fill_styles[first.fill_style_idx]);
                current_fill = first.fill_style_idx;
            }
//          }
            const m = first.p0;

            this.commands.push(new RenderCommand(RenderOp.move_to, m.x, m.y));
            this.commands.push(first.to_command());

            let prev = first;
            let loop = false;

            while (!loop) {
                let found = false;
                for (let i = 0; i < left; ++i) {
                    if (prev.connects(fills[i])) {
                        prev = fills[i];
                        fills[i] = fills[--left];
                        this.commands.push(prev.to_command());
                        found = true;
                        if (prev.connects(first)) {
                            loop = true;
                        }
                        break;
                    }
                }

                if (!found) {
                    /*trace("Remaining:");
                    for (f in 0...left)
                        fills[f].dump ();

                    throw("Dangling fill : " + prev.x1 + "," + prev.y1 + "  " + prev.fillStyle);*/
                    break;
                }
            }
        }

        if (fills.length !== 0) {
            this.commands.push(new RenderCommand(RenderOp.fill_end));
        }

        if (edges.length !== 0) {
            //trace("EDGES: " + edges.toString());
            for (const e of edges) {
                this.commands.push(e);
            }
            this.commands.push(new RenderCommand(RenderOp.line_style_reset));
        }
    }
}