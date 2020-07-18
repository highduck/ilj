import {Color4, Rect} from "@highduck/math";
import {BlendMode} from "./BlendMode";

function createGLContext(canvas: HTMLCanvasElement, options: WebGLContextAttributes): WebGLRenderingContext | null {
    const ids = ['webgl2', 'webgl', 'experimental-webgl'];
    for (let i = 0; i < ids.length; ++i) {
        const context = canvas.getContext(ids[i] as 'webgl', options);
        if (context != null) {
            return context;
        }
    }
    return null;
}

export class Graphics {
    readonly currentFramebufferRect = new Rect();
    readonly viewportRect = new Rect();
    readonly gl: WebGLRenderingContext;

    triangles = 0;
    drawCalls = 0;

    readonly maxRenderBufferSize: number = 2048;
    readonly maxTextureSize: number = 2048;

    constructor(canvas: HTMLCanvasElement) {
        const options: WebGLContextAttributes = {
            alpha: false,
            depth: false,
            stencil: false,
            // premultipliedAlpha: true, // ignored while alpha is false
            antialias: false,
            desynchronized: true,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: true
        };
        let GL = createGLContext(canvas, options);
        if (GL == null) {
            throw new Error("GL context is not created");
        }

        this.maxRenderBufferSize = GL.getParameter(GL.MAX_RENDERBUFFER_SIZE);
        this.maxTextureSize = GL.getParameter(GL.MAX_TEXTURE_SIZE);
        console.debug("GL.VERSION:", GL.getParameter(GL.VERSION));
        console.debug("GL.SHADING_LANGUAGE_VERSION:", GL.getParameter(GL.SHADING_LANGUAGE_VERSION));
        console.debug("GL.VENDOR:", GL.getParameter(GL.VENDOR));
        console.debug("GL.MAX_RENDERBUFFER_SIZE:", this.maxRenderBufferSize);
        console.debug("GL.MAX_TEXTURE_SIZE:", this.maxTextureSize);

        this.gl = GL;
        GL.depthMask(false);
        GL.enable(GL.BLEND);
        GL.disable(GL.DEPTH_TEST);
        GL.disable(GL.STENCIL_TEST);
        GL.disable(GL.DITHER);
        GL.disable(GL.CULL_FACE);
        GL.hint(GL.GENERATE_MIPMAP_HINT, GL.NICEST);
    }

    begin() {
        this.triangles = 0;
        this.drawCalls = 0;
    }

    clear(color: Color4) {
        const GL = this.gl;
        GL.clearColor(color.r, color.g, color.b, color.a);
        GL.clear(GL.COLOR_BUFFER_BIT);
    }

    viewport(rc?: Rect) {
        const GL = this.gl;
        if (rc) {
            this.viewportRect.copyFrom(rc);
            GL.viewport(rc.x, rc.y, rc.width, rc.height);
        } else {
            this.viewportRect.copyFrom(this.currentFramebufferRect);
            GL.viewport(0, 0, this.currentFramebufferRect.width, this.currentFramebufferRect.height);
        }
    }

    blendMode(blendMode: BlendMode) {
        this.gl.blendFunc(blendMode.source, blendMode.destination);
    }

    scissors(rc?: Rect) {
        const GL = this.gl;
        if (rc) {
            GL.enable(GL.SCISSOR_TEST);
            GL.scissor(rc.x, this.currentFramebufferRect.height - rc.y - rc.height, rc.width, rc.height);
        } else {
            GL.disable(GL.SCISSOR_TEST);
        }
    }

    getPixels(rc: Rect, pixels: ArrayBufferView | null) {
        const GL = this.gl;
        const h = this.currentFramebufferRect.height;
        GL.readPixels(
            rc.x,
            this.currentFramebufferRect.height - rc.y - rc.height,
            rc.width,
            rc.height,
            GL.RGBA,
            GL.UNSIGNED_BYTE,
            pixels
        );
    }

    drawTriangles(indicesCount: number) {
        this.triangles += (indicesCount / 3) | 0;
        ++this.drawCalls;

        const GL = this.gl;
        GL.drawElements(GL.TRIANGLES, indicesCount, GL.UNSIGNED_SHORT, 0);
    }

}
