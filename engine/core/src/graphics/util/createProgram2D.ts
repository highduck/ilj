/// <reference path="./glsl.d.ts" />

import fs from './2d.frag.glsl';
import vs from './2d.vert.glsl';

import {Graphics} from "../Graphics";
import {Program} from "../Program";

export function createProgram2D(graphics: Graphics): Program {
    return new Program(graphics, vs, fs);
}