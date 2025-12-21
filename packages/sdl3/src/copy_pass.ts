import type { GPUBufferLocation, GPUBufferRegion, GPUTransferBufferLocation } from "sdl3";

import {
    type GPUCopyPassPtr,
    sdlCopyGPUBufferToBuffer,
    sdlDownloadFromGPUBuffer,
    sdlEndGPUCopyPass,
    sdlUploadToGPUBuffer,
} from "./ffi";

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

    public downloadFromDeviceBuffer(source: GPUBufferRegion, destination: GPUTransferBufferLocation): void {
        sdlDownloadFromGPUBuffer(this.handle, source, destination);
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
