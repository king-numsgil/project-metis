import { type GPUSamplerPtr, sdlReleaseGPUSampler } from "./ffi";

import { Device } from "./device.ts";

export class Sampler {
    public constructor(private readonly handle: GPUSamplerPtr, private readonly device: Device) {
    }

    public get raw(): GPUSamplerPtr {
        return this.handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUSampler(this.device.raw, this.handle);
    }
}
