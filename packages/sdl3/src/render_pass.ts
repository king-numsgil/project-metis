import {
    type GPURenderPassPtr,
    sdlBindGPUFragmentStorageBuffers,
    sdlBindGPUGraphicsPipeline,
    sdlBindGPUIndexBuffer,
    sdlBindGPUVertexBuffers,
    sdlBindGPUVertexStorageBuffers,
    sdlDrawGPUIndexedPrimitives,
    sdlDrawGPUPrimitives,
    sdlEndGPURenderPass,
} from "./ffi";

import { DeviceBuffer, type GPUBufferBinding, GPUIndexElementSize } from "sdl3";

import { GraphicsPipeline } from "./graphics_pipeline.ts";

export class RenderPass {
    public constructor(private readonly handle: GPURenderPassPtr) {
    }

    public get raw(): GPURenderPassPtr {
        return this.handle;
    }

    public end(): void {
        sdlEndGPURenderPass(this.handle);
    }

    public bindGraphicsPipeline(pipeline: GraphicsPipeline) {
        sdlBindGPUGraphicsPipeline(this.handle, pipeline.raw);
    }

    public bindVertexBuffers(bindings: GPUBufferBinding[]): void;
    public bindVertexBuffers(bindings: GPUBufferBinding[], first_slot: number): void;
    public bindVertexBuffers(bindings: GPUBufferBinding[], first_slot?: number): void {
        sdlBindGPUVertexBuffers(this.handle, first_slot ?? 0, bindings);
    }

    public bindIndexBuffer(binding: GPUBufferBinding, index_element_size: GPUIndexElementSize): void {
        sdlBindGPUIndexBuffer(this.handle, binding, index_element_size);
    }

    public bindVertexStorageBuffers(bindings: DeviceBuffer[]): void;
    public bindVertexStorageBuffers(bindings: DeviceBuffer[], first_slot: number): void;
    public bindVertexStorageBuffers(bindings: DeviceBuffer[], first_slot?: number): void {
        sdlBindGPUVertexStorageBuffers(this.handle, first_slot ?? 0, bindings.map(db => db.raw));
    }

    public bindFragmentStorageBuffers(bindings: DeviceBuffer[]): void;
    public bindFragmentStorageBuffers(bindings: DeviceBuffer[], first_slot: number): void;
    public bindFragmentStorageBuffers(bindings: DeviceBuffer[], first_slot?: number): void {
        sdlBindGPUFragmentStorageBuffers(this.handle, first_slot ?? 0, bindings.map(db => db.raw));
    }

    public drawIndexedPrimitives(num_indices: number): void;
    public drawIndexedPrimitives(num_indices: number, num_instances: number): void;
    public drawIndexedPrimitives(num_indices: number, num_instances: number, first_index: number, vertex_offset: number): void;
    public drawIndexedPrimitives(num_indices: number, num_instances: number, first_index: number, vertex_offset: number, first_instance: number): void;
    public drawIndexedPrimitives(num_indices: number, num_instances?: number, first_index?: number, vertex_offset?: number, first_instance?: number): void {
        sdlDrawGPUIndexedPrimitives(this.handle, num_indices, num_instances ?? 1, first_index ?? 0, vertex_offset ?? 0, first_instance ?? 0);
    }

    public drawPrimitives(num_vertices: number): void
    public drawPrimitives(num_vertices: number, num_instances: number): void
    public drawPrimitives(num_vertices: number, num_instances: number, first_vertex: number, first_instance: number): void
    public drawPrimitives(num_vertices: number, num_instances?: number, first_vertex?: number, first_instance?: number): void {
        sdlDrawGPUPrimitives(this.handle, num_vertices, num_instances ?? 1, first_vertex ?? 0, first_instance ?? 0);
    }
}
