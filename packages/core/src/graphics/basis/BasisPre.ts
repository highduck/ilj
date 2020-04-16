// const enum BasisFormat {
//     cTFETC1 = 0,
//     cTFETC2 = 1,
//     cTFBC1 = 2,
//     cTFBC3 = 3,
//     cTFBC4 = 4,
//     cTFBC5 = 5,
//     cTFBC7_M6_OPAQUE_ONLY = 6,
//     cTFBC7_M5 = 7,
//     cTFPVRTC1_4_RGB = 8,
//     cTFPVRTC1_4_RGBA = 9,
//     cTFASTC_4x4 = 10,
//     cTFATC_RGB = 11,
//     cTFATC_RGBA_INTERPOLATED_ALPHA = 12,
//     cTFRGBA32 = 13,
//     cTFRGB565 = 14,
//     cTFBGR565 = 15,
//     cTFRGBA4444 = 16
// }
//
// // DXT formats, from:
// // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
// const enum DXTFormat {
//     COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0,
//     COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1,
//     COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2,
//     COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3,
// }
//
// const DXT_FORMAT_MAP = {
//     [BasisFormat.cTFBC1]: DXTFormat.COMPRESSED_RGB_S3TC_DXT1_EXT,
//     [BasisFormat.cTFBC3]: DXTFormat.COMPRESSED_RGBA_S3TC_DXT5_EXT
// };
//
// class BasisPre {
//
//     format: number;
//     astcSupported = this.gl.getExtension('WEBGL_compressed_texture_astc') != null;
//     etcSupported = this.gl.getExtension('WEBGL_compressed_texture_etc1') != null;
//     dxtSupported = this.gl.getExtension('WEBGL_compressed_texture_s3tc') != null;
//     pvrtcSupported = this.gl.getExtension('WEBGL_compressed_texture_pvrtc') != null
//         || this.gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc') != null;
//
//     constructor(readonly gl: WebGLRenderingContext) {
//         if (this.astcSupported) {
//             this.format = BasisFormat.cTFASTC_4x4;
//         } else if (this.dxtSupported) {
//             this.format = BasisFormat.cTFBC3;
//         } else if (this.pvrtcSupported) {
//             this.format = BasisFormat.cTFPVRTC1_4_RGBA;
//         } else if (this.etcSupported) {
//             this.format = BasisFormat.cTFETC1;
//         } else {
//             throw new Error('No suitable compressed texture format found.');
//         }
//     }
// }
//
// const BasisWorker = function () {
//     let config;
//     let transcoderPending;
//     let _BasisFile;
//
//     onmessage = function (e) {
//         const message = e.data;
//         switch (message.type) {
//             case 'init':
//                 config = message.config;
//                 init((message as any).transcoderBinary);
//                 break;
//             case 'transcode':
//                 transcoderPending.then(() => {
//                     try {
//                         const {width, height, hasAlpha, mipmaps, format} = transcode(message.buffer);
//                         const buffers = [];
//
//                         for (let i = 0; i < mipmaps.length; ++i) {
//                             buffers.push(mipmaps[i].data.buffer);
//                         }
//
//                         self.postMessage({
//                             type: 'transcode',
//                             id: message.id,
//                             width,
//                             height,
//                             hasAlpha,
//                             mipmaps,
//                             format
//                         }, buffers);
//                     } catch (error) {
//                         console.error(error);
//                         self.postMessage({type: 'error', id: message.id, error: error.message});
//                     }
//                 });
//                 break;
//         }
//     };
//
//     function init(wasmBinary) {
//
//         let BasisModule;
//         transcoderPending = new Promise((resolve) => {
//             BasisModule = {wasmBinary, onRuntimeInitialized: resolve};
//             BASIS(BasisModule);
//         }).then(() => {
//             const {BasisFile, initializeBasis} = BasisModule;
//             _BasisFile = BasisFile;
//             initializeBasis();
//         });
//
//     }
//
//     function transcode(buffer) {
//         const basisFile = new _BasisFile(new Uint8Array(buffer));
//         const width = basisFile.getImageWidth(0, 0);
//         const height = basisFile.getImageHeight(0, 0);
//         const levels = basisFile.getNumLevels(0);
//         const hasAlpha = basisFile.getHasAlpha();
//
//         function cleanup() {
//             basisFile.close();
//             basisFile.delete();
//         }
//
//         if (!hasAlpha) {
//             switch (config.format) {
//                 case 9: // Hardcoded: BasisTextureLoader.BASIS_FORMAT.cTFPVRTC1_4_RGBA
//                     config.format = 8; // Hardcoded: BasisTextureLoader.BASIS_FORMAT.cTFPVRTC1_4_RGB;
//                     break;
//                 default:
//                     break;
//             }
//         }
//
//         if (!width || !height || !levels) {
//             cleanup();
//             throw new Error('THREE.BasisTextureLoader:  Invalid .basis file');
//         }
//
//         if (!basisFile.startTranscoding()) {
//             cleanup();
//             throw new Error('THREE.BasisTextureLoader: .startTranscoding failed');
//         }
//
//         const mipmaps = [];
//         for (let mip = 0; mip < levels; ++mip) {
//             const mipWidth = basisFile.getImageWidth(0, mip);
//             const mipHeight = basisFile.getImageHeight(0, mip);
//             const dst = new Uint8Array(basisFile.getImageTranscodedSizeInBytes(0, mip, config.format));
//             const status = basisFile.transcodeImage(
//                 dst,
//                 0,
//                 mip,
//                 config.format,
//                 0,
//                 hasAlpha
//             );
//             if (!status) {
//                 cleanup();
//                 throw new Error('THREE.BasisTextureLoader: .transcodeImage failed.');
//             }
//             mipmaps.push({data: dst, width: mipWidth, height: mipHeight});
//         }
//
//         cleanup();
//         return {width, height, hasAlpha, mipmaps, format: config.format};
//     }
// };
