import {TransformModel} from "./TransformModel";
import {BoundsBuilder, Vec2} from "@highduck/math";
import {RenderCommand} from "./RenderCommand";
import {Element} from "../xfl/types";
import {RenderBatch} from "./RenderBatch";
import {RenderOp} from "./RenderOp";
import {ShapeEdge} from "./ShapeEdge";
import {EdgeSelectionBit} from "../xfl/parseEdges";
import {logDebug, logError, logWarning} from "../debug";

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
    fillStyles: RenderCommand[] = [];
    lineStyles: RenderCommand[] = [];

    constructor(transform: TransformModel) {
        this.transform.copyFrom(transform);
    }

    decode(el: Element) {
        ++this.total;

        const matrix = this.transform.matrix;

        this.readFillStyles(el);
        this.readLineStyles(el);

        const pen = new Vec2(0, 0);

        let currentFill0 = 0;
        let currentFill1 = 0;
        let currentLine = -1;

        const edges: RenderCommand[] = [];
        let fills: ShapeEdge[] = [];
        //let back_fills: ShapeEdge[] = [];

        for (const edge of el.edges) {
            let lineStarted = false;
            const edgeCommands = edge.commands;
            const values = edge.values;
            if (edgeCommands.length === 0) {
                continue;
            }

            //back_fills = [];

            const isNewLineStyle = edge.strokeStyle !== currentLine;
            currentFill0 = edge.fillStyle0;
            currentFill1 = edge.fillStyle1;

            let radius = 0;

            if (isNewLineStyle) {
                const lineStyleIdx = edge.strokeStyle;
                edges.push(this.lineStyles[lineStyleIdx]);
                currentLine = lineStyleIdx;

                radius = lineStyleIdx < 1 ? 0 : (el.strokes[lineStyleIdx - 1].solid.weight / 2);
            }

            let valueIndex = 0;

            for (const cmd of edgeCommands) {
                if (cmd === CommandSymbol.MOVE_TO) {
                    const v1 = values[valueIndex++];
                    const v2 = values[valueIndex++];
                    const p = new Vec2();
                    matrix.transform(v1, v2, p);

                    //if (px != penX || py != penY) {
                    if (currentLine > 0 && !(lineStarted && pen.equals(p))) {
                        this.extend(p.x, p.y, radius);
                        edges.push(new RenderCommand(RenderOp.move_to, p.x, p.y));
                        lineStarted = true;
                    }
                    //}

                    pen.copyFrom(p);
                } else if (cmd === CommandSymbol.LINE_TO || cmd === CommandSymbol.LINE_TO_) {
                    const v1 = values[valueIndex++];
                    const v2 = values[valueIndex++];

                    const p = new Vec2();
                    matrix.transform(v1, v2, p);
                    this.extend(p.x, p.y, radius);

                    if (currentLine > 0) {
                        edges.push(new RenderCommand(RenderOp.line_to, p.x, p.y));
                    } else {
                        edges.push(new RenderCommand(RenderOp.move_to, p.x, p.y));
                    }

                    if (currentFill0 > 0) {
                        fills.push(ShapeEdge.line(currentFill0, pen, p));
                    }

                    if (currentFill1 > 0) {
                        fills.push(ShapeEdge.line(currentFill1, p, pen));
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

                    if (currentLine > 0) {
                        edges.push(new RenderCommand(RenderOp.curve_to, c.x, c.y, p.x, p.y));
                    }

                    if (currentFill0 > 0) {
                        fills.push(ShapeEdge.curve(currentFill0, pen, c, p));
                    }

                    if (currentFill1 > 0) {
                        fills.push(ShapeEdge.curve(currentFill1, p, c, pen));
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
            //fills = fills.concat(back_fills);
        }
        this.flushCommands(edges, fills);
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

    private readFillStyles(el: Element) {
        const result: RenderCommand[] = [];

        // Special null fill-style
        result.push(new RenderCommand(RenderOp.fill_end));

        for (const fill of el.fills) {
            const cmd = new RenderCommand(RenderOp.fill_begin);
            cmd.fill = fill;
            result.push(cmd);
        }

        this.fillStyles = result;
    }

    private readLineStyles(el: Element) {
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
        this.lineStyles = result;
    }

    private flushCommands(edges: RenderCommand[], fills: ShapeEdge[]) {
        let left = fills.length;
//        bool init = false;
        let currentFill = 0;
        let fillBeginCount = 0;
        while (left > 0) {
            let first = fills[0];
            let fillFounded = false;
            if (currentFill > 0) {
                for (let i = 0; i < left; ++i) {
                    if (fills[i].fillStyleIndex === currentFill) {
                        first = fills[i];
                        fills.splice(i, 1);
                        --left;
                        fillFounded = true;
                        break;
                    }
                }
            }
            if (!fillFounded) {
                fills.splice(0, 1);
                //fills[0] = fills[--left];
                --left;
            }
            if (first.fillStyleIndex >= this.fillStyles.length) {
                logWarning(`Fill Style ${first.fillStyleIndex} not found`);
                continue;
            }

            //if (!init) {
            //init = true;
            if (currentFill !== first.fillStyleIndex) {
                this.commands.push(this.fillStyles[first.fillStyleIndex]);
                currentFill = first.fillStyleIndex;
                ++fillBeginCount;
            }
            //}
            const m = first.p0;

            this.commands.push(new RenderCommand(RenderOp.move_to, m.x, m.y));
            this.commands.push(first.toCommand());

            let prev = first;
            let loop = false;

            while (!loop) {
                let found = false;
                for (let i = 0; i < left; ++i) {
                    if (prev.connects(fills[i])) {
                        prev = fills[i];
                        fills.splice(i, 1);
                        --left;
                        // fills[i] = fills[--left];
                        this.commands.push(prev.toCommand());
                        found = true;
                        if (prev.connects(first)) {
                            loop = true;
                        }
                        break;
                    }
                }

                if (!found) {
                    logDebug("Remaining:");
                    //for (let f = 0; f < left; ++f) {
                    //fills[f].dump();
                    //}

                    //throw("Dangling fill : " + prev.x1 + "," + prev.y1 + "  " + prev.fillStyle);
                    logError(`Dangling fill: ${prev.p0.x}, ${prev.p0.y}`, prev.fillStyleIndex);
                    break;
                }
            }
        }

        if (fillBeginCount > 0) {
            this.commands.push(new RenderCommand(RenderOp.fill_end));
        }

        if (edges.length !== 0) {
            for (const e of edges) {
                this.commands.push(e);
            }
            this.commands.push(new RenderCommand(RenderOp.line_style_reset));
        }
    }
}