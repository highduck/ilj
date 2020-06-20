precision mediump float;

varying vec2 vTexCoord;
varying lowp vec4 vColorMult;
varying lowp vec4 vColorOffset;

uniform lowp sampler2D uImage0;

void main() {
    lowp vec4 pixelColor = texture2D(uImage0, vTexCoord, -0.5);
    pixelColor *= vColorMult;
    gl_FragColor = pixelColor + vColorOffset * pixelColor.wwww;
}