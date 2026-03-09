import type { GPUDevicePtr } from "sdl3/ffi";
import type { PropertiesID } from "sdl3";
import {
    ttfCreateGPUTextEngine,
    ttfCreateGPUTextEngineWithProperties,
    ttfDestroyGPUTextEngine,
    ttfGetGPUTextDrawData,
    ttfGetGPUTextEngineWinding,
    ttfSetGPUTextEngineWinding,
} from "./ffi/index.ts";
import type { GPUAtlasDrawSequence, GPUTextEngineWinding, TextEnginePtr, TextPtr } from "./ffi/types/index.ts";

export class GPUTextEngine {
    private constructor(private readonly handle: TextEnginePtr) {
    }

    public get raw(): TextEnginePtr {
        return this.handle;
    }

    public get winding(): GPUTextEngineWinding {
        return ttfGetGPUTextEngineWinding(this.handle);
    }

    public set winding(winding: GPUTextEngineWinding) {
        ttfSetGPUTextEngineWinding(this.handle, winding);
    }

    public static create(device: GPUDevicePtr): GPUTextEngine {
        const handle = ttfCreateGPUTextEngine(device);
        if (!handle) {
            throw new Error(`TTF_CreateGPUTextEngine failed`);
        }
        return new GPUTextEngine(handle);
    }

    public static createWithProperties(props: PropertiesID): GPUTextEngine {
        const handle = ttfCreateGPUTextEngineWithProperties(props);
        if (!handle) {
            throw new Error(`TTF_CreateGPUTextEngineWithProperties failed`);
        }
        return new GPUTextEngine(handle);
    }

    public getDrawData(text: { raw: TextPtr }): GPUAtlasDrawSequence[] | null {
        return ttfGetGPUTextDrawData(text.raw);
    }

    public [Symbol.dispose](): void {
        ttfDestroyGPUTextEngine(this.handle);
    }
}
