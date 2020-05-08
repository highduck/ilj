import {Graphics} from "./Graphics";
import {declTypeID} from "../util/TypeID";
import {Vec2} from "@highduck/math";

const enum TextureType {
    Color32,
    Depth16,
    Depth24,
}

function isPowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0;
}

let prevBindingCubeMap: WebGLTexture | undefined = undefined;
let prevBindingTexture2D: WebGLTexture | undefined = undefined;

function setupBegin(GL: WebGLRenderingContext, target: GLenum, tex: WebGLTexture) {
    GL.bindTexture(target, tex);
    // TODO: const / restore state
    // glPixelStorei(UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
}

function setupEnd(GL: WebGLRenderingContext, target: GLenum, mipmapFiltering: boolean) {

    const minFilter = mipmapFiltering ? GL.LINEAR_MIPMAP_LINEAR : GL.LINEAR;
    GL.texParameteri(target, GL.TEXTURE_MIN_FILTER, minFilter);
    GL.texParameteri(target, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(target, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(target, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    // #ifndef EK_GLES2
    // if (target_type == GL_TEXTURE_CUBE_MAP) {
    //     glTexParameteri(target_type, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);
    // }
    // #endif

    if (target == GL.TEXTURE_CUBE_MAP && prevBindingCubeMap) {
        GL.bindTexture(GL.TEXTURE_CUBE_MAP, prevBindingCubeMap);
    } else if (target == GL.TEXTURE_2D && prevBindingTexture2D) {
        GL.bindTexture(GL.TEXTURE_2D, prevBindingTexture2D);
    }
}

export class Texture {
    static TYPE_ID = declTypeID();

    target: GLenum;
    texture: WebGLTexture;
    type: TextureType = TextureType.Color32;
    whitePoint?: Vec2;

    generateMipMaps = false;
    hasMipMap = false;
    pow = false;
    readonly sourceSize = new Vec2();

    constructor(public graphics: Graphics, public isCubeMap: boolean = false) {
        const GL = graphics.gl;
        this.target = isCubeMap ? GL.TEXTURE_CUBE_MAP : GL.TEXTURE_2D;
        this.texture = GL.createTexture() as WebGLTexture;
    }

    dispose() {
        this.graphics.gl.deleteTexture(this.texture);
    }

    reset(width: number, height: number, type = TextureType.Color32) {
        const GL = this.graphics.gl;

        this.type = type;

        setupBegin(GL, this.target, this.texture);

        let formatInternal = GL.RGBA;
        let formatTexture = GL.RGBA;
        let pixelType = GL.UNSIGNED_BYTE;

        switch (this.type) {
            case TextureType.Depth16:
                formatTexture = GL.DEPTH_COMPONENT;
                formatInternal = GL.DEPTH_COMPONENT16;
                pixelType = GL.UNSIGNED_SHORT;
                break;
            case TextureType.Depth24:
                formatTexture = GL.DEPTH_COMPONENT;
                // #ifdef EK_GLES2
                formatInternal = GL.DEPTH_COMPONENT16;
                // internal_format = GL.DEPTH_COMPONENT;
                pixelType = GL.UNSIGNED_SHORT;
                // #else
                // internal_format = GL.DEPTH_COMPONENT24;
                // pixel_type = GL.UNSIGNED_INT;
                // #endif
                break;
            default:
                break;
        }

        if (this.isCubeMap) {
            for (let i = 0; i < 6; ++i) {
                GL.texImage2D(GL.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, formatInternal,
                    width, height, 0, formatTexture, pixelType, null);
            }
        } else {
            GL.texImage2D(this.target, 0, formatInternal,
                width, height, 0, formatTexture, pixelType, null);
        }

        setupEnd(GL, this.target, this.hasMipMap);
    }

    upload(source: TexImageSource, premultiply: boolean = true) {
        const GL = this.graphics.gl;
        if(premultiply) {
            GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        }
        setupBegin(GL, this.target, this.texture);
        GL.texImage2D(this.target, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, source);

        this.sourceSize.set(source.width, source.height);
        this.pow = isPowerOf2(source.width) && isPowerOf2(source.height);
        if (this.generateMipMaps && this.pow) {
            this.hasMipMap = true;
            GL.generateMipmap(GL.TEXTURE_2D);
        }

        setupEnd(GL, this.target, this.hasMipMap);

        if(premultiply) {
            GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
        }
    }

    uploadCubeMap(sources: TexImageSource[]) {
        const GL = this.graphics.gl;
        const cubeMapSides = [
            GL.TEXTURE_CUBE_MAP_POSITIVE_X,
            GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
            GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
            GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
            GL.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        ];
        setupBegin(GL, this.target, this.texture);
        for (let i = 0; i < 6; ++i) {
            GL.texImage2D(cubeMapSides[i], 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, sources[i]);
        }
        setupEnd(GL, this.target, this.hasMipMap);
    }

    uploadPixels(width: number, height: number, pixelsRGBA32: ArrayBufferView) {
        const GL = this.graphics.gl;
        setupBegin(GL, this.target, this.texture);
        GL.texImage2D(this.target, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE, pixelsRGBA32);

        this.sourceSize.set(width, height);
        this.pow = isPowerOf2(this.sourceSize.x) && isPowerOf2(this.sourceSize.y);
        if (this.generateMipMaps && this.pow) {
            this.hasMipMap = true;
            GL.generateMipmap(GL.TEXTURE_2D);
        }
        setupEnd(GL, this.target, this.hasMipMap);
    }

    bind(unit: GLint) {
        const GL = this.graphics.gl;
        GL.activeTexture(GL.TEXTURE0 + unit);
        GL.bindTexture(this.target, this.texture);

        if (this.target == GL.TEXTURE_CUBE_MAP) {
            prevBindingCubeMap = this.texture;
        } else if (this.target == GL.TEXTURE_2D) {
            prevBindingTexture2D = this.texture;
        }
    }

    // async loadBasis(url: string): Promise<void> {
    //     const buffer = await loadBuffer(url);
    //     const GL = this.graphics.gl;
    //     const transcoded = await BasisTools.TranscodeAsync(buffer, {
    //         supportedCompressionFormats: {
    //             astc: GL.getExtension('WEBGL_compressed_texture_astc') != null,
    //             etc2: GL.getExtension('WEBGL_compressed_texture_etc') != null,
    //             etc1: GL.getExtension('WEBGL_compressed_texture_etc1') != null,
    //             s3tc: GL.getExtension('WEBGL_compressed_texture_s3tc') != null,
    //             pvrtc: GL.getExtension('WEBGL_compressed_texture_pvrtc') != null
    //                 || GL.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc') != null
    //         },
    //         loadMipmapLevels: true,
    //         loadSingleImage: 0
    //     });
    //     BasisTools.LoadTextureFromTranscodeResult(this, transcoded);
    // }
    //
    // uploadBasis(transcodeResult: TranscodeResult) {
    //     const GL = this.graphics.gl;
    //     setupBegin(GL, this.target, this.texture);
    //     const mainImage = transcodeResult.fileInfo.images[0];
    //     const rootLevel = mainImage.levels[0];
    //     this.sourceSize.set(rootLevel.width, rootLevel.height);
    //     // Upload all mip levels in the file
    //     const internalFormat = BasisTools.GetInternalFormatFromBasisFormat(transcodeResult.format!);
    //     this.hasMipMap = mainImage.levels.length > 1;
    //     mainImage.levels.forEach((level: ImageLevelInfo, lod: number) => {
    //         GL.compressedTexImage2D(this.target, lod, internalFormat, level.width, level.height, 0, <DataView>level.transcodedPixels);
    //     });
    //     setupEnd(GL, this.target, this.hasMipMap);
    // }
}
