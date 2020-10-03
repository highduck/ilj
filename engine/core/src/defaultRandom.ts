import {Lcg32, Random} from "@highduck/math";

const RndDefault = new Random(new Lcg32());
const RndGame = new Random(new Lcg32());

export {RndDefault, RndGame};