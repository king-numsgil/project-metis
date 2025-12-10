import {
    type GPUColorTargetInfo,
    type GPUCommandBufferPtr,
    type GPUDepthStencilTargetInfo,
    type GPUTexturePtr,
    sdlBeginGPURenderPass,
    sdlGetError,
    sdlSubmitGPUCommandBuffer,
    sdlSubmitGPUCommandBufferAndAcquireFence,
    sdlWaitAndAcquireGPUSwapchainTexture,
} from "./ffi";

import { RenderPass } from "./render_pass.ts";
import type { Window } from "./window.ts";
import type { Device } from "./device.ts";
import { Fence } from "./fence.ts";

export class CommandBuffer {
    public constructor(private readonly handle: GPUCommandBufferPtr) {
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

    public beginRenderPass(colorTargets: GPUColorTargetInfo[], depthSencil: GPUDepthStencilTargetInfo | null): RenderPass {
        return new RenderPass(sdlBeginGPURenderPass(this.handle, colorTargets, depthSencil));
    }

    public submit(): boolean {
        return sdlSubmitGPUCommandBuffer(this.handle);
    }

    public submitWithFence(device: Device): Fence {
        const fence = sdlSubmitGPUCommandBufferAndAcquireFence(this.handle);
        if (!fence) {
            throw new Error(`Failed to submitWithFence: ${sdlGetError()}`);
        }

        return new Fence(device, fence);
    }
}