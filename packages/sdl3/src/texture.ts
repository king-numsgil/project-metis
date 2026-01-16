import { type GPUTexturePtr, sdlReleaseGPUTexture } from "./ffi";

import { Device } from "./device.ts";

export class Texture {
    public constructor(private readonly handle: GPUTexturePtr, private readonly device: Device) {
    }

    public get raw(): GPUTexturePtr {
        return this.handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUTexture(this.device.raw, this.handle);
    }
}
