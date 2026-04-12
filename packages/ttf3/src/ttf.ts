import { sdlGetError } from "sdl3/ffi";
import { ttfGetFreeTypeVersion, ttfGetHarfBuzzVersion, ttfInit, ttfQuit, ttfVersion } from "./ffi";

export class TTF {
    public constructor() {
        const flag = ttfInit();
        if (!flag) {
            throw new Error(`Failed to initialize TTF : ${sdlGetError()}`);
        }
    }

    public get version(): string {
        const v = ttfVersion();
        return `${Math.floor(v / 1000000)}.${Math.floor(v / 1000) % 1000}.${v % 1000}`;
    }

    public get freetypeVersion(): string {
        const v = ttfGetFreeTypeVersion();
        return `${v[0]}.${v[1]}.${v[2]}`;
    }

    public get harfbuzzVersion(): string {
        const v = ttfGetHarfBuzzVersion();
        return `${v[0]}.${v[1]}.${v[2]}`;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        ttfQuit();
    }
}
