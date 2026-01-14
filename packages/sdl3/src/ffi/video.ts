import { decode } from "koffi";

import {
    FlashOperation,
    type SDL_WindowFlags,
    type SDLRect,
    VideoTheme,
    type WindowID,
    WindowPosition,
    type WindowPtr,
} from "./types";
import { sdl3, sdlFree } from "./lib.ts";

export const sdlGetNumVideoDrivers = sdl3.func("int SDL_GetNumVideoDrivers()") as () => number;
export const sdlGetVideoDriver = sdl3.func("const char* SDL_GetVideoDriver(int index)") as (index: number) => string;
export const sdlGetCurrentVideoDriver = sdl3.func("const char* SDL_GetCurrentVideoDriver()") as () => string;
export const sdlGetSystemTheme = sdl3.func("int SDL_GetSystemTheme()") as () => VideoTheme;

const SDL_GetDisplays = sdl3.func("SDL_DisplayID* SDL_GetDisplays(_Out_ int* count)");

export function sdlGetDisplays(): Array<number> | null {
    const countOut = [0];
    const displaysPtr = SDL_GetDisplays(countOut);
    if (displaysPtr === null) {
        return null;
    }

    const displays = decode(displaysPtr, "SDL_DisplayID", countOut[0]!);
    sdlFree(displaysPtr);
    return displays;
}

export const sdlGetPrimaryDisplay = sdl3.func("SDL_DisplayID SDL_GetPrimaryDisplay()") as () => number;
export const sdlGetDisplayName = sdl3.func("const char* SDL_GetDisplayName(SDL_DisplayID index)") as (index: number) => string;

const SDL_GetDisplayBounds = sdl3.func("bool SDL_GetDisplayBounds(SDL_DisplayID index, _Out_ SDL_Rect* rect)");

export function sdlGetDisplayBounds(index: number): SDLRect | null {
    const rect = {};
    const success = SDL_GetDisplayBounds(index, rect);

    if (!success) {
        return null;
    }

    return rect as SDLRect;
}

export const sdlGetDisplayContentScale = sdl3.func("float SDL_GetDisplayContentScale(SDL_DisplayID index)") as (index: number) => number;
export const sdlCreateWindow = sdl3.func("SDL_Window* SDL_CreateWindow(const char* title, int w, int h, SDL_WindowFlags flags)") as (title: string, w: number, h: number, flags: SDL_WindowFlags) => WindowPtr | null;
export const sdlDestroyWindow = sdl3.func("void SDL_DestroyWindow(SDL_Window* window)") as (window: WindowPtr) => void;
export const sdlGetWindowID = sdl3.func("SDL_WindowID SDL_GetWindowID(SDL_Window* window)") as (window: WindowPtr) => WindowID;
export const sdlGetWindowFromID = sdl3.func("SDL_Window* SDL_GetWindowFromID(SDL_WindowID id)") as (id: WindowID) => WindowPtr | null;
export const sdlSetWindowTitle = sdl3.func("bool SDL_SetWindowTitle(SDL_Window* window, const char* title)") as (window: WindowPtr, title: string) => boolean;
export const sdlGetWindowTitle = sdl3.func("const char* SDL_GetWindowTitle(SDL_Window* window)") as (window: WindowPtr) => string;
export const sdlSetWindowPosition = sdl3.func("bool SDL_SetWindowPosition(SDL_Window* window, int x, int y)") as (window: WindowPtr, x: number | WindowPosition, y: number | WindowPosition) => boolean;

const SDL_GetWindowPosition = sdl3.func("bool SDL_GetWindowPosition(SDL_Window* window, _Out_ int* x, _Out_ int* y)");

export function sdlGetWindowPosition(window: WindowPtr): [number, number] | null {
    const outX = [0], outY = [0];
    const success: boolean = SDL_GetWindowPosition(window, outX, outY);
    return success ? [outX[0]!, outY[0]!] : null;
}

export const sdlSetWindowSize = sdl3.func("bool SDL_SetWindowSize(SDL_Window* window, int w, int h)") as (window: WindowPtr, w: number, h: number) => boolean;

const SDL_GetWindowSize = sdl3.func("bool SDL_GetWindowSize(SDL_Window* window, _Out_ int* w, _Out_ int* h)");

export function sdlGetWindowSize(window: WindowPtr): [number, number] | null {
    const outW = [0], outH = [0];
    const success: boolean = SDL_GetWindowSize(window, outW, outH);
    return success ? [outW[0]!, outH[0]!] : null;
}

export const sdlShowWindow = sdl3.func("bool SDL_ShowWindow(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlHideWindow = sdl3.func("bool SDL_HideWindow(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlRaiseWindow = sdl3.func("bool SDL_RaiseWindow(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlMaximizeWindow = sdl3.func("bool SDL_MaximizeWindow(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlMinimizeWindow = sdl3.func("bool SDL_MinimizeWindow(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlRestoreWindow = sdl3.func("bool SDL_RestoreWindow(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlSetWindowFullscreen = sdl3.func("bool SDL_SetWindowFullscreen(SDL_Window* window, bool fullscreen)") as (window: WindowPtr, fullscreen: boolean) => boolean;
export const sdlSetWindowKeyboardGrab = sdl3.func("bool SDL_SetWindowKeyboardGrab(SDL_Window* window, bool grabbed)") as (window: WindowPtr, grabbed: boolean) => boolean;
export const sdlSetWindowMouseGrab = sdl3.func("bool SDL_SetWindowMouseGrab(SDL_Window* window, bool grabbed)") as (window: WindowPtr, grabbed: boolean) => boolean;
export const sdlGetWindowKeyboardGrab = sdl3.func("bool SDL_GetWindowKeyboardGrab(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlGetWindowMouseGrab = sdl3.func("bool SDL_GetWindowMouseGrab(SDL_Window* window)") as (window: WindowPtr) => boolean;
export const sdlFlashWindow = sdl3.func("bool SDL_FlashWindow(SDL_Window* window, int operation)") as (window: WindowPtr, operation: FlashOperation) => boolean;
