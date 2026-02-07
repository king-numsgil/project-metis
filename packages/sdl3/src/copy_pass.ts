import type {
    GPUBufferLocation,
    GPUBufferRegion,
    GPUTextureRegion,
    GPUTextureTransferInfo,
    GPUTransferBufferLocation,
} from "sdl3";

import {
    type GPUCopyPassPtr,
    sdlCopyGPUBufferToBuffer,
    sdlCopyGPUTextureToTexture,
    sdlDownloadFromGPUBuffer,
    sdlDownloadFromGPUTexture,
    sdlEndGPUCopyPass,
    sdlUploadToGPUBuffer,
    sdlUploadToGPUTexture,
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

    public uploadToTexture(source: GPUTextureTransferInfo, destination: GPUTextureRegion): void;
    public uploadToTexture(source: GPUTextureTransferInfo, destination: GPUTextureRegion, cycle: boolean): void;
    public uploadToTexture(source: GPUTextureTransferInfo, destination: GPUTextureRegion, cycle?: boolean): void {
        sdlUploadToGPUTexture(this.handle, source, destination, cycle ?? false);
    }

    public downloadFromTexture(source: GPUTextureRegion, destination: GPUTextureTransferInfo): void {
        sdlDownloadFromGPUTexture(this.handle, source, destination);
    }

    public copyTextureToTexture(source: GPUTextureTransferInfo, destination: GPUTextureTransferInfo, w: number, h: number, d: number): void;
    public copyTextureToTexture(source: GPUTextureTransferInfo, destination: GPUTextureTransferInfo, w: number, h: number, d: number, cycle: boolean): void;
    public copyTextureToTexture(source: GPUTextureTransferInfo, destination: GPUTextureTransferInfo, w: number, h: number, d: number, cycle?: boolean): void {
        sdlCopyGPUTextureToTexture(this.handle, source, destination, w, h, d, cycle ?? false);
    }

    public end(): void {
        sdlEndGPUCopyPass(this.handle);
    }
}
