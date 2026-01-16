import { type GPUComputePipelinePtr, sdlReleaseGPUComputePipeline } from "./ffi";

import { Device } from "./device.ts";

export class ComputePipeline {
    public constructor(private readonly handle: GPUComputePipelinePtr, private readonly device: Device) {
    }

    public get raw(): GPUComputePipelinePtr {
        return this.handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUComputePipeline(this.device.raw, this.handle);
    }
}
