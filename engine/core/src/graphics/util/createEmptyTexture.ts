import {Graphics} from "../Graphics";
import {Texture} from "../Texture";
import {Recta} from "@highduck/math";

export function createEmptyTexture(graphics: Graphics): Texture {
    const texture = new Texture(graphics);
    texture.generateMipMaps = true;
    texture.uploadPixels(4, 4, new Uint8Array(4 * 4 * 4).fill(0xFF));
    texture.spot = new Recta(0.0, 0.0, 1.0, 1.0);
    return texture;
}
