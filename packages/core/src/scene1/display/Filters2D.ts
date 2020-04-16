import {FilterJson} from "../ani/AniJson";
import {declTypeID} from "../../util/TypeID";

export class Filters2D {
    static TYPE_ID = declTypeID();

    enabled = true;
    processing = false;
    filters: FilterJson[] = [];
}