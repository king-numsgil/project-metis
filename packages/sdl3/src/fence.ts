import { type GPUFencePtr, sdlQueryGPUFence, sdlReleaseGPUFence, sdlWaitForGPUFences } from "./ffi";

import type { Device } from "./device.ts";

export class Fence {
    public constructor(private readonly device: Device, private readonly handle: GPUFencePtr) {
    }

    public get raw(): GPUFencePtr {
        return this.handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUFence(this.device.raw, this.handle);
    }

    public query(): boolean {
        return sdlQueryGPUFence(this.device.raw, this.handle);
    }

    public wait(): boolean {
        return sdlWaitForGPUFences(this.device.raw, true, [this.handle]);
    }
}