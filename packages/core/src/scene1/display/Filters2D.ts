import {declTypeID} from "../../util/TypeID";
import {FilterJson} from "@highduck/anijson";

export class Filters2D {
    static TYPE_ID = declTypeID();

    enabled = true;
    processing = false;
    filters: FilterJson[] = [];
}