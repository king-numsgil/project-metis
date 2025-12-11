import { FlashOperation, type SDL_WindowFlags, type WindowID } from "sdl3";
import {
    sdlCreateWindow,
    sdlDestroyWindow,
    sdlFlashWindow,
    sdlGetError,
    sdlGetWindowFromID,
    sdlGetWindowID,
    sdlGetWindowTitle,
    sdlHideWindow,
    sdlMaximizeWindow,
    sdlMinimizeWindow,
    sdlRaiseWindow,
    sdlRestoreWindow,
    sdlSetWindowTitle,
    sdlShowWindow,
    type WindowPtr,
} from "./ffi";

export class Window {
    private constructor(private readonly handle: WindowPtr) {
        this.handle = handle;
    }

    public get raw(): WindowPtr {
        return this.handle;
    }

    public get windowID(): WindowID {
        return sdlGetWindowID(this.handle);
    }

    public get title(): string {
        return sdlGetWindowTitle(this.handle);
    }

    public set title(title: string) {
        if (!sdlSetWindowTitle(this.handle, title)) {
            throw new Error(`Failed to set title: ${sdlGetError()}`);
        }
    }

    public static create(title: string, width: number, height: number, flags: SDL_WindowFlags = 0n): Window {
        const handle = sdlCreateWindow(title, width, height, flags);
        if (!handle) {
            throw new Error(`Failed to create Window: ${sdlGetError()}`);
        }

        return new Window(handle);
    }

    public static fromID(ID: WindowID): Window {
        const handle = sdlGetWindowFromID(ID);
        if (!handle) {
            throw new Error(`Failed to find Window: ${sdlGetError()}`);
        }

        return new Window(handle);
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlDestroyWindow(this.handle);
    }

    public show(): void {
        if (!sdlShowWindow(this.handle)) {
            throw new Error(`Failed to show Window: ${sdlGetError()}`);
        }
    }

    public hide(): void {
        if (!sdlHideWindow(this.handle)) {
            throw new Error(`Failed to hide Window: ${sdlGetError()}`);
        }
    }

    public raise(): void {
        if (!sdlRaiseWindow(this.handle)) {
            throw new Error(`Failed to raise Window: ${sdlGetError()}`);
        }
    }

    public restore(): void {
        if (!sdlRestoreWindow(this.handle)) {
            throw new Error(`Failed to restore Window: ${sdlGetError()}`);
        }
    }

    public minimize(): void {
        if (!sdlMinimizeWindow(this.handle)) {
            throw new Error(`Failed to minimize Window: ${sdlGetError()}`);
        }
    }

    public maximize(): void {
        if (!sdlMaximizeWindow(this.handle)) {
            throw new Error(`Failed to maximize Window: ${sdlGetError()}`);
        }
    }

    public flash(operation: FlashOperation): void {
        if (!sdlFlashWindow(this.handle, operation)) {
            throw new Error(`Failed to flash Window: ${sdlGetError()}`);
        }
    }
}
