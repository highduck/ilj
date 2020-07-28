import {FilterJson} from "@highduck/anijson";
import {ComponentTypeA} from "../../ecs";

class Filters2D_Data {
    enabled = true;
    processing = false;
    filters: FilterJson[] = [];
}

export const Filters2D = new ComponentTypeA(Filters2D_Data);