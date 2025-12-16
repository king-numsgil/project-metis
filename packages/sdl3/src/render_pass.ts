import {
    type GPURenderPassPtr,
    sdlBindGPUGraphicsPipeline,
    sdlBindGPUVertexBuffers,
    sdlDrawGPUPrimitives,
    sdlEndGPURenderPass
} from "./ffi";

import { GraphicsPipeline } from "./graphics_pipeline.ts";
import type { GPUBufferBinding } from "./ffi/types";

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

    public drawPrimitives(num_vertices: number): void
    public drawPrimitives(num_vertices: number, num_instances: number): void
    public drawPrimitives(num_vertices: number, num_instances: number, first_vertex: number, first_instance: number): void
    public drawPrimitives(num_vertices: number, num_instances?: number, first_vertex?: number, first_instance?: number): void {
        sdlDrawGPUPrimitives(this.handle, num_vertices, num_instances ?? 1, first_vertex ?? 0, first_instance ?? 0);
    }
}