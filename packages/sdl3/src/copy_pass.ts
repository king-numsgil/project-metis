import {type GPUCopyPassPtr, sdlCopyGPUBufferToBuffer, sdlEndGPUCopyPass, sdlUploadToGPUBuffer} from "./ffi";
import type {GPUBufferLocation, GPUBufferRegion, GPUTransferBufferLocation} from "./ffi/types";

export class CopyPass {
    public constructor(private readonly handle: GPUCopyPassPtr) {
    }

    public get raw(): GPUCopyPassPtr {
        return this.handle;
    }

    public uploadToDeviceBuffer(source: GPUTransferBufferLocation, destination: GPUBufferRegion): void;
    public uploadToDeviceBuffer(source: GPUTransferBufferLocation, destination: GPUBufferRegion, cycle: boolean): void;
    public uploadToDeviceBuffer(source: GPUTransferBufferLocation, destination: GPUBufferRegion, cycle?: boolean): void {
        sdlUploadToGPUBuffer(this.handle, source, destination, cycle ?? false);
    }

    public copyBufferToBuffer(source: GPUBufferLocation, destination: GPUBufferLocation, size: number): void;
    public copyBufferToBuffer(source: GPUBufferLocation, destination: GPUBufferLocation, size: number, cycle: boolean): void;
    public copyBufferToBuffer(source: GPUBufferLocation, destination: GPUBufferLocation, size: number, cycle?: boolean): void {
        sdlCopyGPUBufferToBuffer(this.handle, source, destination, size, cycle ?? false);
    }

    public end(): void {
        sdlEndGPUCopyPass(this.handle);
    }
}
