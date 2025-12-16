import { type GPUGraphicsPipelinePtr, sdlReleaseGPUGraphicsPipeline } from "./ffi";

import { Device } from "./device.ts";

export class GraphicsPipeline {
    public constructor(private readonly handle: GPUGraphicsPipelinePtr, private readonly device: Device) {
    }

    public get raw(): GPUGraphicsPipelinePtr {
        return this.handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUGraphicsPipeline(this.device.raw, this.handle);
    }
}