import {
    type GPUColorTargetInfo,
    type GPUCommandBufferPtr,
    type GPUDepthStencilTargetInfo,
    type GPUTexturePtr,
    sdlBeginGPURenderPass,
    sdlGetError,
    sdlSubmitGPUCommandBuffer,
    sdlWaitAndAcquireGPUSwapchainTexture,
} from "sdl-ffi";

import type { Window } from "./window.ts";
import { RenderPass } from "./render_pass.ts";

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
}