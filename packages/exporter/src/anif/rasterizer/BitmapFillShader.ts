import {CanvasKit, SkImage, SkShader, SkSurface} from "canvaskit-wasm";
import {DecodedBitmap, FillStyle} from "@highduck/xfl";
import {destroyPMASurface, makePMASurface} from "./SkiaHelpers";
import {logWarning} from "../../env";
import {TransformModel} from "../render/TransformModel";
import {Matrix2D} from "@highduck/math";
import {convertMatrix, convertSpreadMethod} from "./SkiaFunctions";

export class BitmapFillInstance {

    surface: SkSurface;
    image: SkImage;

    constructor(readonly ck: CanvasKit, bitmap: DecodedBitmap) {
        this.surface = makePMASurface(ck, bitmap.width, bitmap.height);
        if (bitmap.data) {
            this.surface.getCanvas().writePixels(bitmap.data, bitmap.width, bitmap.height, 0, 0);
        } else {
            logWarning('error: empty bitmap data!');
        }
        this.image = this.surface.makeImageSnapshot();
        if (this.image == null) {
            logWarning('error: create skia image!');
        }
    }

    dispose() {
        this.image.delete();
        destroyPMASurface(this.ck, this.surface);
    }

    makeShader(fill: FillStyle, transform: TransformModel): SkShader {
        const tileMode = convertSpreadMethod(this.ck, fill.spreadMethod);
        const matrix = new Matrix2D();
        matrix.copyFrom(transform.matrix);
        matrix.mult(fill.matrix);
        const localMatrix = convertMatrix(matrix);
        return ((this.image as any).makeShader(tileMode, tileMode, localMatrix)) as SkShader;
    }
}
