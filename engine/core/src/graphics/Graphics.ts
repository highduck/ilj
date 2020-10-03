import {Recta, Color4} from "@highduck/math";
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
    framebufferWidth = 0;
    framebufferHeight = 0;
    readonly gl: WebGLRenderingContext;

    readonly maxRenderBufferSize: number = 2048;
    readonly maxTextureSize: number = 2048;

    triangles = 0;
    drawCalls = 0;

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

    viewport() {
        // this.vp.x = 0;
        // this.vp.y = 0;
        // this.vp.w = this.framebufferWidth;
        // this.vp.h = this.framebufferHeight;
        this.gl.viewport(0, 0, this.framebufferWidth, this.framebufferHeight);
    }

    viewportRect(rc: Recta) {
        // this.vp.x = 0;
        // this.vp.y = 0;
        // this.vp.w = this.framebufferWidth;
        // this.vp.h = this.framebufferHeight;
        // this.currentViewport.copyFrom(rc);
        this.gl.viewport(rc.x | 0, rc.y | 0, rc.width | 0, rc.height | 0);
    }

    blendMode(blendMode: BlendMode) {
        this.gl.blendFunc(blendMode.source, blendMode.destination);
    }

    scissorsEnable(rc: Recta) {
        const GL = this.gl;
        GL.enable(GL.SCISSOR_TEST);
        GL.scissor(rc.x, this.framebufferHeight - rc.y - rc.height, rc.width, rc.height);
    }

    scissorsDisable() {
        const GL = this.gl;
        GL.disable(GL.SCISSOR_TEST);
    }

    getPixels(rc: Recta, pixels: ArrayBufferView | null) {
        const GL = this.gl;
        GL.readPixels(
            rc.x,
            this.framebufferHeight - rc.y - rc.height,
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
