import type { GPUTexturePtr } from "sdl3/ffi";

export enum GPUTextEngineWinding {
    Invalid = -1,
    Clockwise = 0,
    CounterClockwise = 1,
}

export interface SDLFPoint {
    x: number;
    y: number;
}

export interface GPUAtlasDrawSequence {
    atlas_texture: GPUTexturePtr;
    xy: SDLFPoint[];
    uv: SDLFPoint[];
    num_vertices: number;
    indices: number[];
    num_indices: number;
    image_type: number;
}
