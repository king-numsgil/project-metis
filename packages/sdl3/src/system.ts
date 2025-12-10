import { InitFlags, type SDLEvent } from "sdl3";
import { sdlGetError, sdlGetPlatform, sdlInit, sdlPollEvent, sdlQuit } from "./ffi";

export class System {
    public constructor() {
        const result = sdlInit(InitFlags.Video, InitFlags.Gamepad, InitFlags.Joystick);
        if (!result) {
            throw new Error(`Failed to initialize SDL : ${sdlGetError()}`);
        }
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlQuit();
    }

    public get platform(): string {
        return sdlGetPlatform();
    }

    public* events(): IterableIterator<SDLEvent> {
        let event: SDLEvent | null;

        do {
            event = sdlPollEvent();
            if (event) {
                yield event;
            }
        } while (event);
    }
}
