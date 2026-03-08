import type { Tagged } from "type-fest";
import type { SDLRect } from "sdl3";

export type TextPtr = Tagged<{}, "TTF_Text">;
export type TextEnginePtr = Tagged<{}, "TTF_TextEngine">;

export interface TTFText {
    text: string;
    num_lines: number;
    refcount: number;
}

export enum SubStringFlags {
    DirectionMask = 0x000000FF,
    TextStart     = 0x00000100,
    LineStart     = 0x00000200,
    LineEnd       = 0x00000400,
    TextEnd       = 0x00000800,
}

export interface TTFSubString {
    flags: SubStringFlags;
    offset: number;
    length: number;
    line_index: number;
    cluster_index: number;
    rect: SDLRect;
}
