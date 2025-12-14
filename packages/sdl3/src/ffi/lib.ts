import { load } from "koffi";

import "./c_structs.ts";

export const sdl3 = load(process.platform === "win32" ? "SDL3.dll" : "libSDL3.so");

export const sdlFree = sdl3.func("void SDL_free(void* ptr)");
