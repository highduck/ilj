precision mediump float;

attribute vec2 aPosition;
attribute vec2 aTexCoord;
attribute lowp vec4 aColorMult;
attribute lowp vec4 aColorOffset;

uniform mat4 uModelViewProjection;

varying vec2 vTexCoord;
varying lowp vec4 vColorMult;
varying lowp vec4 vColorOffset;

void main() {
    vTexCoord = aTexCoord;
    vColorMult = aColorMult;
    vColorOffset = aColorOffset;
    gl_Position = uModelViewProjection * vec4(aPosition, 0.0, 1.0);
}