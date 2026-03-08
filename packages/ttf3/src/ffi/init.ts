import { sdl3ttf } from "./lib.ts";

export const ttfVersion = sdl3ttf.func("int TTF_Version()") as () => number;

const TTF_GetFreeTypeVersion = sdl3ttf.func(
    "void TTF_GetFreeTypeVersion(_Out_ int* major, _Out_ int* minor, _Out_ int* patch)"
);

export function ttfGetFreeTypeVersion(): [number, number, number] {
    const major = [0], minor = [0], patch = [0];
    TTF_GetFreeTypeVersion(major, minor, patch);
    return [major[0]!, minor[0]!, patch[0]!];
}

const TTF_GetHarfBuzzVersion = sdl3ttf.func(
    "void TTF_GetHarfBuzzVersion(_Out_ int* major, _Out_ int* minor, _Out_ int* patch)"
);

export function ttfGetHarfBuzzVersion(): [number, number, number] {
    const major = [0], minor = [0], patch = [0];
    TTF_GetHarfBuzzVersion(major, minor, patch);
    return [major[0]!, minor[0]!, patch[0]!];
}

export const ttfInit = sdl3ttf.func("bool TTF_Init()") as () => boolean;
export const ttfQuit = sdl3ttf.func("void TTF_Quit()") as () => void;
export const ttfWasInit = sdl3ttf.func("int TTF_WasInit()") as () => number;
