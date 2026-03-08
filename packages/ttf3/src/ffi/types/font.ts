import type { Tagged } from "type-fest";

export type FontPtr = Tagged<{}, "TTF_Font">;

export enum FontStyleFlags {
    Normal        = 0x00,
    Bold          = 0x01,
    Italic        = 0x02,
    Underline     = 0x04,
    Strikethrough = 0x08,
}

export enum HintingFlags {
    Invalid        = -1,
    Normal         = 0,
    Light          = 1,
    Mono           = 2,
    None           = 3,
    LightSubpixel  = 4,
}

export enum HorizontalAlignment {
    Invalid = -1,
    Left    = 0,
    Center  = 1,
    Right   = 2,
}

export enum Direction {
    Invalid = 0,
    LTR     = 4,
    RTL     = 5,
    TTB     = 6,
    BTT     = 7,
}

export enum ImageType {
    Invalid = 0,
    Alpha   = 1,
    Color   = 2,
    SDF     = 3,
}

export enum FontWeight {
    Thin        = 100,
    ExtraLight  = 200,
    Light       = 300,
    Normal      = 400,
    Medium      = 500,
    SemiBold    = 600,
    Bold        = 700,
    ExtraBold   = 800,
    Black       = 900,
    ExtraBlack  = 950,
}

export interface GlyphMetrics {
    minx: number;
    maxx: number;
    miny: number;
    maxy: number;
    advance: number;
}
