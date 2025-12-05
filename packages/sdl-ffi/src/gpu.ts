import {
    type GPUColorTargetInfo,
    type GPUCommandBufferPtr,
    type GPUDepthStencilTargetInfo,
    type GPUDevicePtr,
    type GPURenderPassPtr,
    type GPUTexturePtr,
    ShaderFormat,
    type WindowPtr,
} from "./types";
import { sdl3 } from "./lib.ts";

export const sdlCreateGPUDevice = sdl3.func("SDL_GPUDevice* SDL_CreateGPUDevice(SDL_GPUShaderFormat format_flags, bool debug_mode, const char* name)") as (format_flags: ShaderFormat, debug_mode: boolean, name: string | null) => GPUDevicePtr | null;
export const sdlDestroyGPUDevice = sdl3.func("void SDL_DestroyGPUDevice(SDL_GPUDevice* device)") as (device: GPUDevicePtr) => void;
export const sdlGetNumGPUDrivers = sdl3.func("int SDL_GetNumGPUDrivers()") as () => number;
export const sdlGetGPUDriver = sdl3.func("const char* SDL_GetGPUDriver(int index)") as (index: number) => string;
export const sdlGetGPUDeviceDriver = sdl3.func("const char* SDL_GetGPUDeviceDriver(SDL_GPUDevice* device)") as (device: GPUDevicePtr) => string;
export const sdlGetGPUShaderFormats = sdl3.func("SDL_GPUShaderFormat SDL_GetGPUShaderFormats(SDL_GPUDevice* device)") as (device: GPUDevicePtr) => ShaderFormat;
export const sdlAcquireGPUCommandBuffer = sdl3.func("SDL_GPUCommandBuffer* SDL_AcquireGPUCommandBuffer(SDL_GPUDevice* device)") as (device: GPUDevicePtr) => GPUCommandBufferPtr | null;
export const sdlClaimWindowForGPUDevice = sdl3.func("bool SDL_ClaimWindowForGPUDevice(SDL_GPUDevice* device, SDL_Window* window)") as (device: GPUDevicePtr, window: WindowPtr) => boolean;
export const sdlReleaseWindowFromGPUDevice = sdl3.func("void SDL_ReleaseWindowFromGPUDevice(SDL_GPUDevice* device, SDL_Window* window)") as (device: GPUDevicePtr, window: WindowPtr) => void;

const SDL_WaitAndAcquireGPUSwapchainTexture = sdl3.func("bool SDL_WaitAndAcquireGPUSwapchainTexture(SDL_GPUCommandBuffer* command_buffer, SDL_Window* window, _Out_ SDL_GPUTexture** swapchain_texture, _Out_ uint32* swapchain_texture_width, _Out_ uint32* swapchain_texture_height)");

export function sdlWaitAndAcquireGPUSwapchainTexture(command_buffer: GPUCommandBufferPtr, window: WindowPtr): {
    texture: GPUTexturePtr,
    width: number,
    height: number
} | null {
    const textureOut = [{}];
    const widthOut = [0], heightOut = [0];

    const result: boolean = SDL_WaitAndAcquireGPUSwapchainTexture(command_buffer, window, textureOut, widthOut, heightOut);
    if (result) {
        return {
            texture: textureOut[0]! as GPUTexturePtr,
            width: widthOut[0]!,
            height: heightOut[0]!,
        };
    }

    return null;
}

const SDL_BeginGPURenderPass = sdl3.func("SDL_GPURenderPass* SDL_BeginGPURenderPass(SDL_GPUCommandBuffer* command_buffer, const SDL_GPUColorTargetInfo* color_target_infos, uint32 num_color_targets, const SDL_GPUDepthStencilTargetInfo* depth_stencil_target_info)");

export function sdlBeginGPURenderPass(commandBuffer: GPUCommandBufferPtr, colorTargets: GPUColorTargetInfo[], depthStencil?: GPUDepthStencilTargetInfo | null): GPURenderPassPtr {
    if (colorTargets.length === 0) {
        throw new Error("sdlBeginGPURenderPass: colorTargets must not be empty");
    }

    return SDL_BeginGPURenderPass(commandBuffer, colorTargets, colorTargets.length, depthStencil ?? null);
}

export const sdlEndGPURenderPass = sdl3.func("void SDL_EndGPURenderPass(SDL_GPURenderPass* render_pass)") as (render_pass: GPURenderPassPtr) => void;
export const sdlSubmitGPUCommandBuffer = sdl3.func("bool SDL_SubmitGPUCommandBuffer(SDL_GPUCommandBuffer* command_buffer)") as (command_buffer: GPUCommandBufferPtr) => boolean;
