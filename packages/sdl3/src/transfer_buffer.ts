import {
    type GPUTransferBufferPtr,
    sdlGetError,
    sdlMapGPUTransferBuffer,
    sdlReleaseGPUTransferBuffer,
    sdlUnmapGPUTransferBuffer
} from "./ffi";

import { Device } from "./device.ts";

export class TransferBuffer {
    public constructor(private readonly device: Device, private readonly handle: GPUTransferBufferPtr, private readonly _size: number) {
    }

    public get raw(): GPUTransferBufferPtr {
        return this.handle;
    }

    public get size(): number {
        return this._size;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUTransferBuffer(this.device.raw, this.handle);
    }

    public map(cb: (array_buffer: ArrayBuffer) => void): void;
    public map(cb: (array_buffer: ArrayBuffer) => void, cycle: boolean): void;
    public map(cb: (array_buffer: ArrayBuffer) => void, cycle?: boolean): void {
        const ab = sdlMapGPUTransferBuffer(this.device.raw, this.handle, this._size, cycle ?? false);
        if (!ab) {
            throw new Error(`Failed to map TransferBuffer: ${sdlGetError()}`);
        }

        try {
            cb(ab);
        } finally {
            sdlUnmapGPUTransferBuffer(this.device.raw, this.handle);
        }
    }
}