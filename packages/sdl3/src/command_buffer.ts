import type { GPUColorTargetInfo, GPUDepthStencilTargetInfo } from "sdl3";
import {
    type GPUCommandBufferPtr,
    type GPUTexturePtr,
    sdlBeginGPUCopyPass,
    sdlBeginGPURenderPass,
    sdlGetError,
    sdlPushGPUComputeUniformData,
    sdlPushGPUFragmentUniformData,
    sdlPushGPUVertexUniformData,
    sdlSubmitGPUCommandBuffer,
    sdlSubmitGPUCommandBufferAndAcquireFence,
    sdlWaitAndAcquireGPUSwapchainTexture,
} from "./ffi";

import { RenderPass } from "./render_pass.ts";
import type { Window } from "./window.ts";
import type { Device } from "./device.ts";
import { CopyPass } from "./copy_pass.ts";
import { Fence } from "./fence.ts";

export class CommandBuffer {
    public constructor(private readonly handle: GPUCommandBufferPtr, private readonly device: Device) {
    }

    public get raw(): GPUCommandBufferPtr {
        return this.handle;
    }

    public waitAndAcquireSwapchainTexture(window: Window): { texture: GPUTexturePtr, width: number, height: number } {
        const result = sdlWaitAndAcquireGPUSwapchainTexture(this.handle, window.raw);
        if (!result) {
            throw new Error(`Failed to waitAndAcquireGPUSwapchainTexture: ${sdlGetError()}`);
        }

        return result;
    }

    public pushVertexUniformData(slot_index: number, data: ArrayBuffer): void {
        sdlPushGPUVertexUniformData(this.handle, slot_index, data);
    }

    public pushFragmentUniformData(slot_index: number, data: ArrayBuffer): void {
        sdlPushGPUFragmentUniformData(this.handle, slot_index, data);
    }

    public pushComputeUniformData(slot_index: number, data: ArrayBuffer): void {
        sdlPushGPUComputeUniformData(this.handle, slot_index, data);
    }

    public beginRenderPass(colorTargets: GPUColorTargetInfo[], depthSencil: GPUDepthStencilTargetInfo | null): RenderPass {
        return new RenderPass(sdlBeginGPURenderPass(this.handle, colorTargets, depthSencil));
    }

    public beginCopyPass(): CopyPass {
        return new CopyPass(sdlBeginGPUCopyPass(this.handle));
    }

    public submit(): boolean {
        return sdlSubmitGPUCommandBuffer(this.handle);
    }

    public submitWithFence(): Fence {
        const fence = sdlSubmitGPUCommandBufferAndAcquireFence(this.handle);
        if (!fence) {
            throw new Error(`Failed to submitWithFence: ${sdlGetError()}`);
        }

        return new Fence(this.device, fence);
    }
}
