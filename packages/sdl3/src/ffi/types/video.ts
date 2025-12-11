import type { Tagged } from "type-fest";

export type WindowPtr = Tagged<{}, "SDL_Window">;
export type WindowID = Tagged<number, "SDL_WindowID">;

export interface SDLRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export enum VideoTheme {
    Unknown,
    Light,
    Dark,
}

export const SDL_WindowFlags = {
    FULLSCREEN: 0x0000000000000001n,
    OPENGL: 0x0000000000000002n,
    OCCLUDED: 0x0000000000000004n,
    HIDDEN: 0x0000000000000008n,
    BORDERLESS: 0x0000000000000010n,
    RESIZABLE: 0x0000000000000020n,
    MINIMIZED: 0x0000000000000040n,
    MAXIMIZED: 0x0000000000000080n,
    MOUSE_GRABBED: 0x0000000000000100n,
    INPUT_FOCUS: 0x0000000000000200n,
    MOUSE_FOCUS: 0x0000000000000400n,
    EXTERNAL: 0x0000000000000800n,
    MODAL: 0x0000000000001000n,
    HIGH_PIXEL_DENSITY: 0x0000000000002000n,
    MOUSE_CAPTURE: 0x0000000000004000n,
    MOUSE_RELATIVE_MODE: 0x0000000000008000n,
    ALWAYS_ON_TOP: 0x0000000000010000n,
    UTILITY: 0x0000000000020000n,
    TOOLTIP: 0x0000000000040000n,
    POPUP_MENU: 0x0000000000080000n,
    KEYBOARD_GRABBED: 0x0000000000100000n,
    VULKAN: 0x0000000010000000n,
    METAL: 0x0000000020000000n,
    TRANSPARENT: 0x0000000040000000n,
    NOT_FOCUSABLE: 0x0000000080000000n,
} as const;

export type SDL_WindowFlags = typeof SDL_WindowFlags[keyof typeof SDL_WindowFlags] | 0n;

export enum WindowPosition {
    Undefined = 0x1FFF0000 | 0,
    Centered = 0x2FFF0000 | 0,
}

export enum FlashOperation {
    Cancel,
    Briefly,
    UntilFocused,
}
