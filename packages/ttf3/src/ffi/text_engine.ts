import { decode } from "koffi";
import type { GPUDevicePtr } from "sdl3/ffi";
import type { PropertiesID } from "sdl3";
import { sdl3ttf } from "./lib.ts";
import type {
    Direction,
    FontPtr,
    GPUAtlasDrawSequence,
    GPUTextEngineWinding,
    SDLFPoint,
    TextEnginePtr,
    TextPtr,
    TTFSubString,
    TTFText,
} from "./types";

// ─── GPU Text Engine ────────────────────────────────────────────────────────

export const ttfCreateGPUTextEngine = sdl3ttf.func(
    "TTF_TextEngine* TTF_CreateGPUTextEngine(SDL_GPUDevice* device)",
) as (device: GPUDevicePtr) => TextEnginePtr | null;

export const ttfCreateGPUTextEngineWithProperties = sdl3ttf.func(
    "TTF_TextEngine* TTF_CreateGPUTextEngineWithProperties(SDL_PropertiesID props)",
) as (props: PropertiesID) => TextEnginePtr | null;

export const ttfDestroyGPUTextEngine = sdl3ttf.func(
    "void TTF_DestroyGPUTextEngine(TTF_TextEngine* engine)",
) as (engine: TextEnginePtr) => void;

export const ttfSetGPUTextEngineWinding = sdl3ttf.func(
    "void TTF_SetGPUTextEngineWinding(TTF_TextEngine* engine, TTF_GPUTextEngineWinding winding)",
) as (engine: TextEnginePtr, winding: GPUTextEngineWinding) => void;

export const ttfGetGPUTextEngineWinding = sdl3ttf.func(
    "TTF_GPUTextEngineWinding TTF_GetGPUTextEngineWinding(TTF_TextEngine* engine)",
) as (engine: TextEnginePtr) => GPUTextEngineWinding;

const TTF_GetGPUTextDrawData = sdl3ttf.func(
    "TTF_GPUAtlasDrawSequence* TTF_GetGPUTextDrawData(TTF_Text* text)",
);

export function ttfGetGPUTextDrawData(text: TextPtr): GPUAtlasDrawSequence[] | null {
    const head = TTF_GetGPUTextDrawData(text);
    if (head === null) {
        return null;
    }

    const sequences: GPUAtlasDrawSequence[] = [];
    let current: object | null = head;

    while (current !== null) {
        const node = decode(current, "TTF_GPUAtlasDrawSequence") as {
            atlas_texture: object;
            xy: object | null;
            uv: object | null;
            num_vertices: number;
            indices: object | null;
            num_indices: number;
            image_type: number;
            next: object | null;
        };

        const xy: SDLFPoint[] = node.xy !== null
            ? (decode(node.xy, "SDL_FPoint", node.num_vertices) as SDLFPoint[])
            : [];
        const uv: SDLFPoint[] = node.uv !== null
            ? (decode(node.uv, "SDL_FPoint", node.num_vertices) as SDLFPoint[])
            : [];
        const indices: number[] = node.indices !== null
            ? (decode(node.indices, "int", node.num_indices) as number[])
            : [];

        sequences.push({
            atlas_texture: node.atlas_texture as never,
            xy,
            uv,
            num_vertices: node.num_vertices,
            indices,
            num_indices: node.num_indices,
            image_type: node.image_type,
        });

        current = node.next;
    }

    return sequences;
}

// ─── TTF_Text ───────────────────────────────────────────────────────────────

export const ttfCreateText = sdl3ttf.func(
    "TTF_Text* TTF_CreateText(TTF_TextEngine* engine, TTF_Font* font, const char* text, size_t length)",
) as (engine: TextEnginePtr | null, font: FontPtr, text: string, length: number) => TextPtr | null;

export const ttfDestroyText = sdl3ttf.func(
    "void TTF_DestroyText(TTF_Text* text)",
) as (text: TextPtr) => void;

export const ttfUpdateText = sdl3ttf.func(
    "bool TTF_UpdateText(TTF_Text* text)",
) as (text: TextPtr) => boolean;

export const ttfGetTextProperties = sdl3ttf.func(
    "SDL_PropertiesID TTF_GetTextProperties(TTF_Text* text)",
) as (text: TextPtr) => PropertiesID;

export const ttfSetTextEngine = sdl3ttf.func(
    "bool TTF_SetTextEngine(TTF_Text* text, TTF_TextEngine* engine)",
) as (text: TextPtr, engine: TextEnginePtr) => boolean;

export const ttfGetTextEngine = sdl3ttf.func(
    "TTF_TextEngine* TTF_GetTextEngine(TTF_Text* text)",
) as (text: TextPtr) => TextEnginePtr | null;

export const ttfSetTextFont = sdl3ttf.func(
    "bool TTF_SetTextFont(TTF_Text* text, TTF_Font* font)",
) as (text: TextPtr, font: FontPtr | null) => boolean;

export const ttfGetTextFont = sdl3ttf.func(
    "TTF_Font* TTF_GetTextFont(TTF_Text* text)",
) as (text: TextPtr) => FontPtr | null;

export const ttfSetTextDirection = sdl3ttf.func(
    "bool TTF_SetTextDirection(TTF_Text* text, TTF_Direction direction)",
) as (text: TextPtr, direction: Direction) => boolean;

export const ttfGetTextDirection = sdl3ttf.func(
    "TTF_Direction TTF_GetTextDirection(TTF_Text* text)",
) as (text: TextPtr) => Direction;

export const ttfSetTextScript = sdl3ttf.func(
    "bool TTF_SetTextScript(TTF_Text* text, uint32 script)",
) as (text: TextPtr, script: number) => boolean;

export const ttfGetTextScript = sdl3ttf.func(
    "uint32 TTF_GetTextScript(TTF_Text* text)",
) as (text: TextPtr) => number;

export const ttfSetTextColor = sdl3ttf.func(
    "bool TTF_SetTextColor(TTF_Text* text, uint8 r, uint8 g, uint8 b, uint8 a)",
) as (text: TextPtr, r: number, g: number, b: number, a: number) => boolean;

export const ttfSetTextColorFloat = sdl3ttf.func(
    "bool TTF_SetTextColorFloat(TTF_Text* text, float r, float g, float b, float a)",
) as (text: TextPtr, r: number, g: number, b: number, a: number) => boolean;

const TTF_GetTextColor = sdl3ttf.func(
    "bool TTF_GetTextColor(TTF_Text* text, _Out_ uint8* r, _Out_ uint8* g, _Out_ uint8* b, _Out_ uint8* a)",
);

export function ttfGetTextColor(text: TextPtr): [number, number, number, number] | null {
    const r = [0], g = [0], b = [0], a = [0];
    const success: boolean = TTF_GetTextColor(text, r, g, b, a);
    return success ? [r[0]!, g[0]!, b[0]!, a[0]!] : null;
}

const TTF_GetTextColorFloat = sdl3ttf.func(
    "bool TTF_GetTextColorFloat(TTF_Text* text, _Out_ float* r, _Out_ float* g, _Out_ float* b, _Out_ float* a)",
);

export function ttfGetTextColorFloat(text: TextPtr): [number, number, number, number] | null {
    const r = [0], g = [0], b = [0], a = [0];
    const success: boolean = TTF_GetTextColorFloat(text, r, g, b, a);
    return success ? [r[0]!, g[0]!, b[0]!, a[0]!] : null;
}

export const ttfSetTextPosition = sdl3ttf.func(
    "bool TTF_SetTextPosition(TTF_Text* text, int x, int y)",
) as (text: TextPtr, x: number, y: number) => boolean;

const TTF_GetTextPosition = sdl3ttf.func(
    "bool TTF_GetTextPosition(TTF_Text* text, _Out_ int* x, _Out_ int* y)",
);

export function ttfGetTextPosition(text: TextPtr): [number, number] | null {
    const x = [0], y = [0];
    const success: boolean = TTF_GetTextPosition(text, x, y);
    return success ? [x[0]!, y[0]!] : null;
}

export const ttfSetTextWrapWidth = sdl3ttf.func(
    "bool TTF_SetTextWrapWidth(TTF_Text* text, int wrap_width)",
) as (text: TextPtr, wrapWidth: number) => boolean;

const TTF_GetTextWrapWidth = sdl3ttf.func(
    "bool TTF_GetTextWrapWidth(TTF_Text* text, _Out_ int* wrap_width)",
);

export function ttfGetTextWrapWidth(text: TextPtr): number | null {
    const w = [0];
    const success: boolean = TTF_GetTextWrapWidth(text, w);
    return success ? w[0]! : null;
}

export const ttfSetTextWrapWhitespaceVisible = sdl3ttf.func(
    "bool TTF_SetTextWrapWhitespaceVisible(TTF_Text* text, bool visible)",
) as (text: TextPtr, visible: boolean) => boolean;

export const ttfTextWrapWhitespaceVisible = sdl3ttf.func(
    "bool TTF_TextWrapWhitespaceVisible(TTF_Text* text)",
) as (text: TextPtr) => boolean;

export const ttfSetTextString = sdl3ttf.func(
    "bool TTF_SetTextString(TTF_Text* text, const char* string, size_t length)",
) as (text: TextPtr, string: string | null, length: number) => boolean;

export const ttfInsertTextString = sdl3ttf.func(
    "bool TTF_InsertTextString(TTF_Text* text, int offset, const char* string, size_t length)",
) as (text: TextPtr, offset: number, string: string, length: number) => boolean;

export const ttfAppendTextString = sdl3ttf.func(
    "bool TTF_AppendTextString(TTF_Text* text, const char* string, size_t length)",
) as (text: TextPtr, string: string, length: number) => boolean;

export const ttfDeleteTextString = sdl3ttf.func(
    "bool TTF_DeleteTextString(TTF_Text* text, int offset, int length)",
) as (text: TextPtr, offset: number, length: number) => boolean;

const TTF_GetTextSize = sdl3ttf.func(
    "bool TTF_GetTextSize(TTF_Text* text, _Out_ int* w, _Out_ int* h)",
);

export function ttfGetTextSize(text: TextPtr): [number, number] | null {
    const w = [0], h = [0];
    const success: boolean = TTF_GetTextSize(text, w, h);
    return success ? [w[0]!, h[0]!] : null;
}

export function ttfDecodeText(text: TextPtr): TTFText {
    return decode(text, "TTF_Text") as TTFText;
}

// ─── SubString ──────────────────────────────────────────────────────────────

const TTF_GetTextSubString = sdl3ttf.func(
    "bool TTF_GetTextSubString(TTF_Text* text, int offset, _Out_ TTF_SubString* substring)",
);

export function ttfGetTextSubString(text: TextPtr, offset: number): TTFSubString | null {
    const sub = {};
    const success: boolean = TTF_GetTextSubString(text, offset, sub);
    return success ? sub as TTFSubString : null;
}

const TTF_GetTextSubStringForLine = sdl3ttf.func(
    "bool TTF_GetTextSubStringForLine(TTF_Text* text, int line, _Out_ TTF_SubString* substring)",
);

export function ttfGetTextSubStringForLine(text: TextPtr, line: number): TTFSubString | null {
    const sub = {};
    const success: boolean = TTF_GetTextSubStringForLine(text, line, sub);
    return success ? sub as TTFSubString : null;
}

const TTF_GetTextSubStringForPoint = sdl3ttf.func(
    "bool TTF_GetTextSubStringForPoint(TTF_Text* text, int x, int y, _Out_ TTF_SubString* substring)",
);

export function ttfGetTextSubStringForPoint(text: TextPtr, x: number, y: number): TTFSubString | null {
    const sub = {};
    const success: boolean = TTF_GetTextSubStringForPoint(text, x, y, sub);
    return success ? sub as TTFSubString : null;
}

const TTF_GetPreviousTextSubString = sdl3ttf.func(
    "bool TTF_GetPreviousTextSubString(TTF_Text* text, TTF_SubString* substring, _Out_ TTF_SubString* previous)",
);

export function ttfGetPreviousTextSubString(text: TextPtr, substring: TTFSubString): TTFSubString | null {
    const prev = {};
    const success: boolean = TTF_GetPreviousTextSubString(text, substring, prev);
    return success ? prev as TTFSubString : null;
}

const TTF_GetNextTextSubString = sdl3ttf.func(
    "bool TTF_GetNextTextSubString(TTF_Text* text, TTF_SubString* substring, _Out_ TTF_SubString* next)",
);

export function ttfGetNextTextSubString(text: TextPtr, substring: TTFSubString): TTFSubString | null {
    const next = {};
    const success: boolean = TTF_GetNextTextSubString(text, substring, next);
    return success ? next as TTFSubString : null;
}
