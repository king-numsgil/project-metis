import { InitFlags } from "./types";
import { sdl3 } from "./lib.ts";

const SDL_Init = sdl3.func("bool SDL_Init(uint32 flags)") as (flags: number) => boolean;

export function sdlInit(...flags: InitFlags[]): boolean {
    return SDL_Init(flags.reduce((previous: InitFlags, current: InitFlags) => previous | current));
}

export const sdlQuit = sdl3.func("void SDL_Quit()") as () => void;
export const sdlGetPlatform = sdl3.func("const char* SDL_GetPlatform()") as () => string;
export const sdlGetError = sdl3.func("const char* SDL_GetError()") as () => string;
