precision highp float;

attribute highp vec2 aPosition;
attribute mediump vec2 aTexCoord;
attribute lowp vec4 aColorMult;
attribute lowp vec4 aColorOffset;

uniform highp mat4 uModelViewProjection;

varying mediump vec2 vTexCoord;
varying lowp vec4 vColorMult;
varying lowp vec4 vColorOffset;

void main() {
    vTexCoord = aTexCoord;
    vColorMult = aColorMult;
    vColorOffset = aColorOffset;
    gl_Position = uModelViewProjection * vec4(aPosition, 0.0, 1.0);
}