export {
    FontStyleFlags,
    HintingFlags,
    HorizontalAlignment,
    Direction,
    ImageType,
    FontWeight,
    SubStringFlags,
    GPUTextEngineWinding,
} from "./ffi/types/index.ts";

export type {
    FontPtr,
    TextPtr,
    TextEnginePtr,
    TTFText,
    TTFSubString,
    GlyphMetrics,
    SDLFPoint,
    GPUAtlasDrawSequence,
} from "./ffi/types/index.ts";

export { ttfInit, ttfQuit, ttfWasInit, ttfVersion, ttfGetFreeTypeVersion, ttfGetHarfBuzzVersion } from "./ffi/init.ts";
export { ttfTagToString, ttfStringToTag, ttfGetGlyphScript } from "./ffi/font.ts";

export * from "./font.ts";
export * from "./text.ts";
export * from "./gpu_text_engine.ts";
