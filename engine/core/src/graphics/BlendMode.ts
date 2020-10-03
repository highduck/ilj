const GL = WebGLRenderingContext;

export class BlendMode {
    constructor(readonly source: GLenum,
                readonly destination: GLenum) {
    }

    static readonly Nop = new BlendMode(GL.ZERO, GL.ZERO);
    static readonly Opaque = new BlendMode(GL.ONE, GL.ZERO);
    static readonly Normal = new BlendMode(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
    static readonly Premultiplied = new BlendMode(GL.ONE, GL.ONE_MINUS_SRC_ALPHA);
    static readonly Add = new BlendMode(GL.ONE, GL.ONE_MINUS_SRC_ALPHA);
    static readonly Screen = new BlendMode(GL.ONE, GL.ONE_MINUS_SRC_COLOR);
    static readonly Exclusion = new BlendMode(GL.ONE_MINUS_DST_COLOR, GL.ONE_MINUS_SRC_COLOR);
}
