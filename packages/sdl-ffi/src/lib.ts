import {load} from "koffi";

import "./c_structs.ts";

export const sdl3 = load("SDL3.dll");

export const sdlFree = sdl3.func("void SDL_free(void* ptr)");
