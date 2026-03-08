import { load } from "koffi";

import "sdl3/ffi";
import "./c_structs.ts";

export const sdl3ttf = load(process.platform === "win32" ? "SDL3_ttf.dll" : "libSDL3_ttf.so");
