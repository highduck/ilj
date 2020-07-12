import {FilterJson} from "@highduck/anijson";
import {ComponentTypeA} from "../..";

export const Filters2D = new ComponentTypeA(class Data {
    enabled = true;
    processing = false;
    filters: FilterJson[] = [];
});