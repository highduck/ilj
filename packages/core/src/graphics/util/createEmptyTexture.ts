import {Graphics} from "../Graphics";
import {Texture} from "../Texture";

export function createEmptyTexture(graphics: Graphics): Texture {
    const texture = new Texture(graphics);
    texture.generateMipMaps = true;
    texture.uploadPixels(4, 4, new Uint8Array(4 * 4 * 4).fill(0xFF));
    return texture;
}
