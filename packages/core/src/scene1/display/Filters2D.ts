import {FilterJson} from "@highduck/anijson";
import {Component} from "../..";

export class Filters2D extends Component() {
    enabled = true;
    processing = false;
    filters: FilterJson[] = [];
}