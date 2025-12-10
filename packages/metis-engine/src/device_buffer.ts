import { type GPUBufferPtr, sdlReleaseGPUBuffer } from "sdl-ffi";

import { Device } from "./device.ts";

export class DeviceBuffer {
    public constructor(private readonly device: Device, private readonly handle: GPUBufferPtr, private readonly _size: number) {
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUBuffer(this.device.raw, this.handle);
    }

    public get raw(): GPUBufferPtr {
        return this.handle;
    }

    public get size(): number {
        return this._size;
    }
}