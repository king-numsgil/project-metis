import {
    type GPUComputePassPtr,
    sdlBindGPUComputePipeline,
    sdlBindGPUComputeSamplers,
    sdlBindGPUComputeStorageBuffers,
    sdlBindGPUComputeStorageTextures,
    sdlDispatchGPUCompute,
    sdlEndGPUComputePass,
} from "./ffi";

import type { GPUTextureSamplerBinding } from "sdl3";

import { ComputePipeline } from "./compute_pipeline.ts";
import { DeviceBuffer } from "./device_buffer.ts";
import type { Texture } from "./texture.ts";

export class ComputePass {
    public constructor(private readonly handle: GPUComputePassPtr) {
    }

    public get raw(): GPUComputePassPtr {
        return this.handle;
    }

    public end(): void {
        sdlEndGPUComputePass(this.handle);
    }

    public bindComputePipeline(compute_pipeline: ComputePipeline): void {
        sdlBindGPUComputePipeline(this.handle, compute_pipeline.raw);
    }

    public dispatch(x: number, y: number, z: number): void {
        sdlDispatchGPUCompute(this.handle, x, y, z);
    }

    public bindComputeSamplers(bindings: GPUTextureSamplerBinding[]): void;
    public bindComputeSamplers(bindings: GPUTextureSamplerBinding[], first_slot: number): void;
    public bindComputeSamplers(bindings: GPUTextureSamplerBinding[], first_slot?: number): void {
        sdlBindGPUComputeSamplers(this.handle, first_slot ?? 0, bindings);
    }

    public bindComputeStorageTextures(bindings: Texture[]): void;
    public bindComputeStorageTextures(bindings: Texture[], first_slot: number): void;
    public bindComputeStorageTextures(bindings: Texture[], first_slot?: number): void {
        sdlBindGPUComputeStorageTextures(this.handle, first_slot ?? 0, bindings.map(db => db.raw));
    }

    public bindComputeStorageBuffers(bindings: DeviceBuffer[]): void;
    public bindComputeStorageBuffers(bindings: DeviceBuffer[], first_slot: number): void;
    public bindComputeStorageBuffers(bindings: DeviceBuffer[], first_slot?: number): void {
        sdlBindGPUComputeStorageBuffers(this.handle, first_slot ?? 0, bindings.map(db => db.raw));
    }
}
