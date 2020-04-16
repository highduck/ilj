/**
 CPS rules:
    worker-src * data: 'unsafe-eval' 'unsafe-inline' blob:;

 ios safari dont support `worker-src`
 */

import {Texture} from "../Texture";
import {loadBuffer, loadText} from "../../util/load";

type Nullable<T> = T | null;

export type ImageLevelInfo = {
    width: number,
    height: number,
    transcodedPixels: ArrayBufferView
};

export type ImageInfo = {
    levels: ImageLevelInfo[];
};

/**
 * Info about the .basis files
 */
export interface BasisFileInfo {
    /**
     * If the file has alpha
     */
    hasAlpha: boolean;
    /**
     * Info about each image of the basis file
     */
    images: ImageInfo[];
}

/**
 * Result of transcoding a basis file
 */
export interface TranscodeResult {
    /**
     * Info about the .basis file
     */
    fileInfo: BasisFileInfo;
    /**
     * Format to use when loading the file
     */
    format: number;
}

/**
 * Configuration options for the Basis transcoder
 */
export interface BasisTranscodeConfiguration {
    /**
     * Supported compression formats used to determine the supported output format of the transcoder
     */
    supportedCompressionFormats?: {
        astc?: boolean;
        /**
         * etc1 compression format
         */
        etc1?: boolean;
        /**
         * s3tc compression format
         */
        s3tc?: boolean;
        /**
         * pvrtc compression format
         */
        pvrtc?: boolean;
        /**
         * etc2 compression format
         */
        etc2?: boolean;
    };
    /**
     * If mipmap levels should be loaded for transcoded images (Default: true)
     */
    loadMipmapLevels?: boolean;
    /**
     * Index of a single image to load (Default: all images)
     */
    loadSingleImage?: number;
}

/**
 * @hidden
 * Enum of basis transcoder formats
 */
enum BASIS_FORMATS {
    cTFETC1 = 0,
    cTFETC2 = 1,
    cTFBC1 = 2,
    cTFBC3 = 3,
    cTFBC4 = 4,
    cTFBC5 = 5,
    cTFBC7_M6_OPAQUE_ONLY = 6,
    cTFBC7_M5 = 7,
    cTFPVRTC1_4_RGB = 8,
    cTFPVRTC1_4_RGBA = 9,
    cTFASTC_4x4 = 10,
    cTFATC_RGB = 11,
    cTFATC_RGBA_INTERPOLATED_ALPHA = 12,
    cTFRGBA32 = 13,
    cTFRGB565 = 14,
    cTFBGR565 = 15,
    cTFRGBA4444 = 16
}

/**
 * Used to load .Basis files
 * See https://github.com/BinomialLLC/basis_universal/tree/master/webgl
 */
export class BasisTools {
    private static _IgnoreSupportedFormats = false;
    /**
     * URL to use when loading the basis transcoder
     */
    public static JSModuleURL = "assets/lib/basis_transcoder.js";
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    public static WasmModuleURL = "assets/lib/basis_transcoder.wasm";


    /**
     * Get the internal format to be passed to texImage2D corresponding to the .basis format value
     * @param basisFormat format chosen from GetSupportedTranscodeFormat
     * @returns internal format corresponding to the Basis format
     */
    public static GetInternalFormatFromBasisFormat(basisFormat: number): number {
        // Corrisponding internal formats

        // ASTC format, from:
        // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
        const COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;

        // DXT formats, from:
        // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
        const COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
        const COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
        const COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
        const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

        // ETC format, from:
        // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/
        const COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

        // PVRTC format, from:
// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
        const COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
        const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;

        if (basisFormat === BASIS_FORMATS.cTFASTC_4x4) {
            return COMPRESSED_RGBA_ASTC_4x4_KHR;
        } else if (basisFormat === BASIS_FORMATS.cTFETC1) {
            return COMPRESSED_RGB_ETC1_WEBGL;
        } else if (basisFormat === BASIS_FORMATS.cTFBC1) {
            return COMPRESSED_RGB_S3TC_DXT1_EXT;
        } else if (basisFormat === BASIS_FORMATS.cTFBC3) {
            return COMPRESSED_RGBA_S3TC_DXT5_EXT;
        } else if (basisFormat === BASIS_FORMATS.cTFPVRTC1_4_RGB) {
            return COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        } else if (basisFormat === BASIS_FORMATS.cTFPVRTC1_4_RGBA) {
            return COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
        } else {
            throw "The chosen Basis transcoder format is not currently supported";
        }
    }

    private static _WorkerPromise: Nullable<Promise<Worker>> = null;
    private static _Worker: Nullable<Worker> = null;
    private static _actionId = 0;

    private static _CreateWorkerAsync(): Promise<Worker> {
        if (!this._WorkerPromise) {
            this._WorkerPromise = new Promise((res) => {
                if (this._Worker) {
                    res(this._Worker);
                } else {
                    loadBuffer(BasisTools.WasmModuleURL).then((wasmBinary) => {
                        loadText(BasisTools.JSModuleURL).then((jsText) => {
                            const workerModuleUrl = URL.createObjectURL(new Blob([jsText], {type: "application/javascript"}));
                            const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunc})()`], {type: "application/javascript"}));
                            this._Worker = new Worker(workerBlobUrl);

                            const initHandler = (msg: any) => {
                                if (msg.data.action === "init") {
                                    this._Worker!.removeEventListener("message", initHandler);
                                    res(this._Worker!);
                                }
                            };
                            this._Worker.addEventListener("message", initHandler);
                            this._Worker.postMessage({
                                action: "init",
                                url: workerModuleUrl,
                                wasmBinary: wasmBinary
                            });
                        });
                    });
                }
            });
        }
        return this._WorkerPromise;
    }

    /**
     * Transcodes a loaded image file to compressed pixel data
     * @param data image data to transcode
     * @param config configuration options for the transcoding
     * @returns a promise resulting in the transcoded image
     */
    public static TranscodeAsync(data: ArrayBuffer | ArrayBufferView, config: BasisTranscodeConfiguration): Promise<TranscodeResult> {
        const dataView = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

        return new Promise((res, rej) => {
            this._CreateWorkerAsync().then(() => {
                const actionId = this._actionId++;
                const messageHandler = (msg: any) => {
                    if (msg.data.action === "transcode" && msg.data.id === actionId) {
                        this._Worker!.removeEventListener("message", messageHandler);
                        if (!msg.data.success) {
                            rej("Transcode is not supported on this device");
                        } else {
                            res(msg.data);
                        }
                    }
                };
                this._Worker!.addEventListener("message", messageHandler);

                const dataViewCopy = new Uint8Array(dataView.byteLength);
                dataViewCopy.set(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength));
                this._Worker!.postMessage({
                    action: "transcode",
                    id: actionId,
                    imageData: dataViewCopy,
                    config: config,
                    ignoreSupportedFormats: this._IgnoreSupportedFormats
                }, [dataViewCopy.buffer]);
            });
        });
    }

    /**
     * Loads a texture from the transcode result
     * @param texture texture load to
     * @param transcodeResult the result of transcoding the basis file to load from
     */
    public static LoadTextureFromTranscodeResult(texture: Texture, transcodeResult: TranscodeResult) {
        let gl = texture.graphics.gl;
        for (let i = 0; i < transcodeResult.fileInfo.images.length; i++) {
            const rootImage = transcodeResult.fileInfo.images[i].levels[0];
            // TODO:
            //texture._invertVScale = texture.invertY;
            // if (transcodeResult.format === -1) {
            //     // No compatable compressed format found, fallback to RGB
            //     texture.type = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
            //     texture.format = Constants.TEXTUREFORMAT_RGB;
            //
            //     if (engine.webGLVersion < 2 && (Scalar.Log2(rootImage.width) % 1 !== 0 || Scalar.Log2(rootImage.height) % 1 !== 0)) {
            //         // Create non power of two texture
            //         let source = new InternalTexture(engine, InternalTextureSource.Temp);
            //
            //         texture._invertVScale = texture.invertY;
            //         source.type = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
            //         source.format = Constants.TEXTUREFORMAT_RGB;
            //         // Fallback requires aligned width/height
            //         source.width = (rootImage.width + 3) & ~3;
            //         source.height = (rootImage.height + 3) & ~3;
            //         engine._bindTextureDirectly(engine._gl.TEXTURE_2D, source, true);
            //         engine._uploadDataToTextureDirectly(source, rootImage.transcodedPixels, i, 0, Constants.TEXTUREFORMAT_RGB, true);
            //
            //         // Resize to power of two
            //         engine._rescaleTexture(source, texture, engine.scenes[0], engine._getInternalFormat(Constants.TEXTUREFORMAT_RGB), () => {
            //             engine._releaseTexture(source);
            //             engine._bindTextureDirectly(engine._gl.TEXTURE_2D, texture, true);
            //         });
            //     } else {
            //         // Fallback is already inverted
            //         texture._invertVScale = !texture.invertY;
            //
            //         // Upload directly
            //         texture.width = (rootImage.width + 3) & ~3;
            //         texture.height = (rootImage.height + 3) & ~3;
            //         engine._uploadDataToTextureDirectly(texture, rootImage.transcodedPixels, i, 0, Constants.TEXTUREFORMAT_RGB, true);
            //     }
            //
            // } else {

            // texture.uploadBasis(transcodeResult);


            // TODO:
            // if (engine.webGLVersion < 2 && (Scalar.Log2(texture.width) % 1 !== 0 || Scalar.Log2(texture.height) % 1 !== 0)) {
            //     console.warn("Loaded .basis texture width and height are not a power of two. Texture wrapping will be set to Texture.CLAMP_ADDRESSMODE as other modes are not supported with non power of two dimensions in webGL 1.");
            //     texture._cachedWrapU = Texture.CLAMP_ADDRESSMODE;
            //     texture._cachedWrapV = Texture.CLAMP_ADDRESSMODE;
            // }
            // }
        }
    }
}

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;

declare function postMessage(message: any, transfer?: any[]): void;

declare var Module: any;
declare var BASIS: any;

function workerFunc(): void {
    const _BASIS_FORMAT = {
        cTFETC1: 0,
        cTFETC2: 1,
        cTFBC1: 2,
        cTFBC3: 3,
        cTFBC4: 4,
        cTFBC5: 5,
        cTFBC7_M6_OPAQUE_ONLY: 6,
        cTFBC7_M5: 7,
        cTFPVRTC1_4_RGB: 8,
        cTFPVRTC1_4_RGBA: 9,
        cTFASTC_4x4: 10,
        cTFATC_RGB: 11,
        cTFATC_RGBA_INTERPOLATED_ALPHA: 12,
        cTFRGBA32: 13,
        cTFRGB565: 14,
        cTFBGR565: 15,
        cTFRGBA4444: 16,
    };
    let transcoderModulePromise: Nullable<Promise<any>> = null;
    onmessage = (event) => {
        if (event.data.action === "init") {
            // Load the transcoder if it hasn't been yet
            if (!transcoderModulePromise) {
                // Override wasm binary
                //Module = {wasmBinary: (event.data.wasmBinary)};
                Module = {wasmBinary: event.data.wasmBinary};
                importScripts(event.data.url);
                transcoderModulePromise = new Promise((res) => {
                    Module.onRuntimeInitialized = () => {
                        Module.initializeBasis();
                        res();
                    };
                });
                BASIS(Module);
            }
            transcoderModulePromise.then(() => {
                postMessage({action: "init"});
            });
        } else if (event.data.action === "transcode") {
            // Transcode the basis image and return the resulting pixels
            const config: BasisTranscodeConfiguration = event.data.config;
            const imgData = event.data.imageData;
            const loadedFile = new Module.BasisFile(imgData);
            const fileInfo = GetFileInfo(loadedFile);
            let format = event.data.ignoreSupportedFormats ? null : GetSupportedTranscodeFormat(event.data.config, fileInfo);

            let needsConversion = false;
            if (format === null) {
                needsConversion = true;
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
            }

            // Begin transcode
            let success = true;
            if (!loadedFile.startTranscoding()) {
                success = false;
            }

            const buffers: Array<any> = [];
            for (let imageIndex = 0; imageIndex < fileInfo.images.length; imageIndex++) {
                if (!success) {
                    break;
                }
                const image = fileInfo.images[imageIndex];
                if (config.loadSingleImage === undefined || config.loadSingleImage === imageIndex) {
                    let mipCount = image.levels.length;
                    if (config.loadMipmapLevels === false) {
                        mipCount = 1;
                    }
                    for (let levelIndex = 0; levelIndex < mipCount; levelIndex++) {
                        const levelInfo = image.levels[levelIndex];

                        const pixels = TranscodeLevel(loadedFile, imageIndex, levelIndex, format!, needsConversion);
                        if (!pixels) {
                            success = false;
                            break;
                        }
                        levelInfo.transcodedPixels = pixels;
                        buffers.push(levelInfo.transcodedPixels.buffer);
                    }
                }
            }
            // Close file
            loadedFile.close();
            loadedFile.delete();

            if (needsConversion) {
                format = -1;
            }
            if (!success) {
                postMessage({action: "transcode", success: success, id: event.data.id});
            } else {
                postMessage({
                    action: "transcode",
                    success: success,
                    id: event.data.id,
                    fileInfo: fileInfo,
                    format: format
                }, buffers);
            }

        }

    };

    /**
     * Detects the supported transcode format for the file
     * @param config transcode config
     * @param fileInfo info about the file
     * @returns the chosed format or null if none are supported
     */
    function GetSupportedTranscodeFormat(config: BasisTranscodeConfiguration, fileInfo: BasisFileInfo): Nullable<number> {
        let format = null;
        if (config.supportedCompressionFormats) {
            if (config.supportedCompressionFormats.astc) {
                format = _BASIS_FORMAT.cTFASTC_4x4;
            } else if (config.supportedCompressionFormats.s3tc) {
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
            } else if (config.supportedCompressionFormats.pvrtc) {
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFPVRTC1_4_RGBA : _BASIS_FORMAT.cTFPVRTC1_4_RGB;
                // TODO uncomment this after pvrtc bug is fixed is basis transcoder
                // See discussion here: https://github.com/mrdoob/three.js/issues/16524#issuecomment-498929924
                // format = _BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY;
            } else if (config.supportedCompressionFormats.etc1) {
                format = _BASIS_FORMAT.cTFETC1;
            } else if (config.supportedCompressionFormats.etc2) {
                format = _BASIS_FORMAT.cTFETC2;
            }
        }
        return format;
    }

    /**
     * Retreives information about the basis file eg. dimensions
     * @param basisFile the basis file to get the info from
     * @returns information about the basis file
     */
    function GetFileInfo(basisFile: any): BasisFileInfo {
        const hasAlpha = basisFile.getHasAlpha();
        const imageCount = basisFile.getNumImages();
        const images = [];
        for (let i = 0; i < imageCount; i++) {
            const imageInfo = {
                levels: ([] as Array<any>)
            };
            const levelCount = basisFile.getNumLevels(i);
            for (let level = 0; level < levelCount; level++) {
                const levelInfo = {
                    width: basisFile.getImageWidth(i, level),
                    height: basisFile.getImageHeight(i, level)
                };
                imageInfo.levels.push(levelInfo);
            }
            images.push(imageInfo);
        }
        return {hasAlpha, images};
    }

    function TranscodeLevel(loadedFile: any, imageIndex: number, levelIndex: number, format: number, convertToRgb565: boolean): Nullable<Uint8Array> {
        const dstSize = loadedFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, format);
        const dst: Nullable<Uint8Array> = new Uint8Array(dstSize);
        if (!loadedFile.transcodeImage(dst, imageIndex, levelIndex, format, 1, 0)) {
            return null;
        }
        // If no supported format is found, load as dxt and convert to rgb565
        // TODO:
        // if (convertToRgb565) {
        //     const alignedWidth = (loadedFile.getImageWidth(imageIndex, levelIndex) + 3) & ~3;
        //     const alignedHeight = (loadedFile.getImageHeight(imageIndex, levelIndex) + 3) & ~3;
        //     dst = ConvertDxtToRgb565(dst, 0, alignedWidth, alignedHeight);
        // }
        return dst;
    }

    /**
     * From https://github.com/BinomialLLC/basis_universal/blob/master/webgl/texture/dxt-to-rgb565.js
     * An unoptimized version of dxtToRgb565.  Also, the floating
     * point math used to compute the colors actually results in
     * slightly different colors compared to hardware DXT decoders.
     * @param src dxt src pixels
     * @param srcByteOffset offset for the start of src
     * @param  width aligned width of the image
     * @param  height aligned height of the image
     * @return the converted pixels
     */
    function ConvertDxtToRgb565(src: Uint8Array, srcByteOffset: number, width: number, height: number): Uint16Array {
        const c = new Uint16Array(4);
        const dst = new Uint16Array(width * height);

        const blockWidth = width / 4;
        const blockHeight = height / 4;
        for (let blockY = 0; blockY < blockHeight; blockY++) {
            for (let blockX = 0; blockX < blockWidth; blockX++) {
                const i = srcByteOffset + 8 * (blockY * blockWidth + blockX);
                c[0] = src[i] | (src[i + 1] << 8);
                c[1] = src[i + 2] | (src[i + 3] << 8);
                c[2] = (2 * (c[0] & 0x1f) + 1 * (c[1] & 0x1f)) / 3
                    | (((2 * (c[0] & 0x7e0) + 1 * (c[1] & 0x7e0)) / 3) & 0x7e0)
                    | (((2 * (c[0] & 0xf800) + 1 * (c[1] & 0xf800)) / 3) & 0xf800);
                c[3] = (2 * (c[1] & 0x1f) + 1 * (c[0] & 0x1f)) / 3
                    | (((2 * (c[1] & 0x7e0) + 1 * (c[0] & 0x7e0)) / 3) & 0x7e0)
                    | (((2 * (c[1] & 0xf800) + 1 * (c[0] & 0xf800)) / 3) & 0xf800);
                for (let row = 0; row < 4; row++) {
                    const m = src[i + 4 + row];
                    let dstI = (blockY * 4 + row) * width + blockX * 4;
                    dst[dstI++] = c[m & 0x3];
                    dst[dstI++] = c[(m >> 2) & 0x3];
                    dst[dstI++] = c[(m >> 4) & 0x3];
                    dst[dstI++] = c[(m >> 6) & 0x3];
                }
            }
        }
        return dst;
    }
}