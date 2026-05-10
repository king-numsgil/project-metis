import type { Tagged } from "type-fest";

export type WidgetID = Tagged<number, "MetisWidget">;

let currentId: WidgetID = 0 as WidgetID;

export function nextWidgetID(): WidgetID {
    currentId = (currentId as number + 1) as WidgetID;
    return currentId;
}
