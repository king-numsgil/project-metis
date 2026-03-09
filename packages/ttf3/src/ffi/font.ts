import type { PropertiesID } from "sdl3";
import { sdl3ttf } from "./lib.ts";
import type { Direction, FontPtr, FontStyleFlags, GlyphMetrics, HintingFlags, HorizontalAlignment } from "./types";

export const ttfOpenFont = sdl3ttf.func(
    "TTF_Font* TTF_OpenFont(const char* file, float ptsize)",
) as (file: string, ptsize: number) => FontPtr | null;

export const ttfOpenFontWithProperties = sdl3ttf.func(
    "TTF_Font* TTF_OpenFontWithProperties(SDL_PropertiesID props)",
) as (props: PropertiesID) => FontPtr | null;

export const ttfCopyFont = sdl3ttf.func(
    "TTF_Font* TTF_CopyFont(TTF_Font* existing_font)",
) as (font: FontPtr) => FontPtr | null;

export const ttfCloseFont = sdl3ttf.func(
    "void TTF_CloseFont(TTF_Font* font)",
) as (font: FontPtr) => void;

export const ttfGetFontProperties = sdl3ttf.func(
    "SDL_PropertiesID TTF_GetFontProperties(TTF_Font* font)",
) as (font: FontPtr) => PropertiesID;

export const ttfGetFontGeneration = sdl3ttf.func(
    "uint32 TTF_GetFontGeneration(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfAddFallbackFont = sdl3ttf.func(
    "bool TTF_AddFallbackFont(TTF_Font* font, TTF_Font* fallback)",
) as (font: FontPtr, fallback: FontPtr) => boolean;

export const ttfRemoveFallbackFont = sdl3ttf.func(
    "void TTF_RemoveFallbackFont(TTF_Font* font, TTF_Font* fallback)",
) as (font: FontPtr, fallback: FontPtr) => void;

export const ttfClearFallbackFonts = sdl3ttf.func(
    "void TTF_ClearFallbackFonts(TTF_Font* font)",
) as (font: FontPtr) => void;

export const ttfSetFontSize = sdl3ttf.func(
    "bool TTF_SetFontSize(TTF_Font* font, float ptsize)",
) as (font: FontPtr, ptsize: number) => boolean;

export const ttfSetFontSizeDPI = sdl3ttf.func(
    "bool TTF_SetFontSizeDPI(TTF_Font* font, float ptsize, int hdpi, int vdpi)",
) as (font: FontPtr, ptsize: number, hdpi: number, vdpi: number) => boolean;

export const ttfGetFontSize = sdl3ttf.func(
    "float TTF_GetFontSize(TTF_Font* font)",
) as (font: FontPtr) => number;

const TTF_GetFontDPI = sdl3ttf.func(
    "bool TTF_GetFontDPI(TTF_Font* font, _Out_ int* hdpi, _Out_ int* vdpi)",
);

export function ttfGetFontDPI(font: FontPtr): [number, number] | null {
    const hdpi = [0], vdpi = [0];
    const success: boolean = TTF_GetFontDPI(font, hdpi, vdpi);
    return success ? [hdpi[0]!, vdpi[0]!] : null;
}

export const ttfSetFontStyle = sdl3ttf.func(
    "void TTF_SetFontStyle(TTF_Font* font, TTF_FontStyleFlags style)",
) as (font: FontPtr, style: FontStyleFlags) => void;

export const ttfGetFontStyle = sdl3ttf.func(
    "TTF_FontStyleFlags TTF_GetFontStyle(TTF_Font* font)",
) as (font: FontPtr) => FontStyleFlags;

export const ttfSetFontOutline = sdl3ttf.func(
    "bool TTF_SetFontOutline(TTF_Font* font, int outline)",
) as (font: FontPtr, outline: number) => boolean;

export const ttfGetFontOutline = sdl3ttf.func(
    "int TTF_GetFontOutline(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfSetFontHinting = sdl3ttf.func(
    "void TTF_SetFontHinting(TTF_Font* font, TTF_HintingFlags hinting)",
) as (font: FontPtr, hinting: HintingFlags) => void;

export const ttfGetFontHinting = sdl3ttf.func(
    "TTF_HintingFlags TTF_GetFontHinting(TTF_Font* font)",
) as (font: FontPtr) => HintingFlags;

export const ttfGetNumFontFaces = sdl3ttf.func(
    "int TTF_GetNumFontFaces(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfSetFontSDF = sdl3ttf.func(
    "bool TTF_SetFontSDF(TTF_Font* font, bool enabled)",
) as (font: FontPtr, enabled: boolean) => boolean;

export const ttfGetFontSDF = sdl3ttf.func(
    "bool TTF_GetFontSDF(TTF_Font* font)",
) as (font: FontPtr) => boolean;

export const ttfGetFontWeight = sdl3ttf.func(
    "int TTF_GetFontWeight(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfSetFontWrapAlignment = sdl3ttf.func(
    "void TTF_SetFontWrapAlignment(TTF_Font* font, TTF_HorizontalAlignment align)",
) as (font: FontPtr, align: HorizontalAlignment) => void;

export const ttfGetFontWrapAlignment = sdl3ttf.func(
    "TTF_HorizontalAlignment TTF_GetFontWrapAlignment(TTF_Font* font)",
) as (font: FontPtr) => HorizontalAlignment;

export const ttfGetFontHeight = sdl3ttf.func(
    "int TTF_GetFontHeight(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfGetFontAscent = sdl3ttf.func(
    "int TTF_GetFontAscent(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfGetFontDescent = sdl3ttf.func(
    "int TTF_GetFontDescent(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfSetFontLineSkip = sdl3ttf.func(
    "void TTF_SetFontLineSkip(TTF_Font* font, int lineskip)",
) as (font: FontPtr, lineskip: number) => void;

export const ttfGetFontLineSkip = sdl3ttf.func(
    "int TTF_GetFontLineSkip(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfSetFontKerning = sdl3ttf.func(
    "void TTF_SetFontKerning(TTF_Font* font, bool enabled)",
) as (font: FontPtr, enabled: boolean) => void;

export const ttfGetFontKerning = sdl3ttf.func(
    "bool TTF_GetFontKerning(TTF_Font* font)",
) as (font: FontPtr) => boolean;

export const ttfFontIsFixedWidth = sdl3ttf.func(
    "bool TTF_FontIsFixedWidth(TTF_Font* font)",
) as (font: FontPtr) => boolean;

export const ttfFontIsScalable = sdl3ttf.func(
    "bool TTF_FontIsScalable(TTF_Font* font)",
) as (font: FontPtr) => boolean;

export const ttfGetFontFamilyName = sdl3ttf.func(
    "const char* TTF_GetFontFamilyName(TTF_Font* font)",
) as (font: FontPtr) => string;

export const ttfGetFontStyleName = sdl3ttf.func(
    "const char* TTF_GetFontStyleName(TTF_Font* font)",
) as (font: FontPtr) => string;

export const ttfSetFontDirection = sdl3ttf.func(
    "bool TTF_SetFontDirection(TTF_Font* font, TTF_Direction direction)",
) as (font: FontPtr, direction: Direction) => boolean;

export const ttfGetFontDirection = sdl3ttf.func(
    "TTF_Direction TTF_GetFontDirection(TTF_Font* font)",
) as (font: FontPtr) => Direction;

export const ttfStringToTag = sdl3ttf.func(
    "uint32 TTF_StringToTag(const char* string)",
) as (string: string) => number;

export function ttfTagToString(tag: number): string {
    return String.fromCharCode(
        (tag >>> 24) & 0xFF,
        (tag >>> 16) & 0xFF,
        (tag >>> 8) & 0xFF,
        tag & 0xFF,
    );
}

export const ttfSetFontScript = sdl3ttf.func(
    "bool TTF_SetFontScript(TTF_Font* font, uint32 script)",
) as (font: FontPtr, script: number) => boolean;

export const ttfGetFontScript = sdl3ttf.func(
    "uint32 TTF_GetFontScript(TTF_Font* font)",
) as (font: FontPtr) => number;

export const ttfGetGlyphScript = sdl3ttf.func(
    "uint32 TTF_GetGlyphScript(uint32 ch)",
) as (ch: number) => number;

export const ttfSetFontLanguage = sdl3ttf.func(
    "bool TTF_SetFontLanguage(TTF_Font* font, const char* language_bcp47)",
) as (font: FontPtr, language: string | null) => boolean;

export const ttfFontHasGlyph = sdl3ttf.func(
    "bool TTF_FontHasGlyph(TTF_Font* font, uint32 ch)",
) as (font: FontPtr, ch: number) => boolean;

const TTF_GetGlyphMetrics = sdl3ttf.func(
    "bool TTF_GetGlyphMetrics(TTF_Font* font, uint32 ch, _Out_ int* minx, _Out_ int* maxx, _Out_ int* miny, _Out_ int* maxy, _Out_ int* advance)",
);

export function ttfGetGlyphMetrics(font: FontPtr, ch: number): GlyphMetrics | null {
    const minx = [0], maxx = [0], miny = [0], maxy = [0], advance = [0];
    const success: boolean = TTF_GetGlyphMetrics(font, ch, minx, maxx, miny, maxy, advance);
    if (!success) {
        return null;
    }
    return {
        minx: minx[0]!,
        maxx: maxx[0]!,
        miny: miny[0]!,
        maxy: maxy[0]!,
        advance: advance[0]!,
    };
}

const TTF_GetGlyphKerning = sdl3ttf.func(
    "bool TTF_GetGlyphKerning(TTF_Font* font, uint32 previous_ch, uint32 ch, _Out_ int* kerning)",
);

export function ttfGetGlyphKerning(font: FontPtr, previousCh: number, ch: number): number | null {
    const kerning = [0];
    const success: boolean = TTF_GetGlyphKerning(font, previousCh, ch, kerning);
    return success ? kerning[0]! : null;
}

const TTF_GetStringSize = sdl3ttf.func(
    "bool TTF_GetStringSize(TTF_Font* font, const char* text, size_t length, _Out_ int* w, _Out_ int* h)",
);

export function ttfGetStringSize(font: FontPtr, text: string): [number, number] | null {
    const w = [0], h = [0];
    const success: boolean = TTF_GetStringSize(font, text, 0, w, h);
    return success ? [w[0]!, h[0]!] : null;
}

const TTF_GetStringSizeWrapped = sdl3ttf.func(
    "bool TTF_GetStringSizeWrapped(TTF_Font* font, const char* text, size_t length, int wrap_width, _Out_ int* w, _Out_ int* h)",
);

export function ttfGetStringSizeWrapped(font: FontPtr, text: string, wrapWidth: number): [number, number] | null {
    const w = [0], h = [0];
    const success: boolean = TTF_GetStringSizeWrapped(font, text, 0, wrapWidth, w, h);
    return success ? [w[0]!, h[0]!] : null;
}

const TTF_MeasureString = sdl3ttf.func(
    "bool TTF_MeasureString(TTF_Font* font, const char* text, size_t length, int max_width, _Out_ int* measured_width, _Out_ size_t* measured_length)",
);

export function ttfMeasureString(font: FontPtr, text: string, maxWidth: number): {
    width: number;
    length: number
} | null {
    const measuredWidth = [0], measuredLength = [0];
    const success: boolean = TTF_MeasureString(font, text, 0, maxWidth, measuredWidth, measuredLength);
    if (!success) {
        return null;
    }
    return {width: measuredWidth[0]!, length: measuredLength[0]!};
}
