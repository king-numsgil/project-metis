import { view } from "koffi";

import {
    type GPUBufferBinding,
    type GPUBufferCreateInfo,
    type GPUBufferLocation,
    type GPUBufferPtr,
    type GPUBufferRegion,
    type GPUColorTargetInfo,
    type GPUCommandBufferPtr,
    type GPUCopyPassPtr,
    type GPUDepthStencilTargetInfo,
    type GPUDevicePtr,
    type GPUFencePtr,
    type GPUGraphicsPipelineCreateInfo,
    type GPUGraphicsPipelinePtr,
    type GPURenderPassPtr,
    type GPUShaderCreateInfo,
    GPUShaderFormat,
    type GPUShaderPtr,
    GPUTextureFormat,
    type GPUTexturePtr,
    type GPUTransferBufferCreateInfo,
    type GPUTransferBufferLocation,
    type GPUTransferBufferPtr,
    type WindowPtr,
} from "./types";
import { sdl3 } from "./lib.ts";

export const sdlCreateGPUDevice = sdl3.func("SDL_GPUDevice* SDL_CreateGPUDevice(SDL_GPUShaderFormat format_flags, bool debug_mode, const char* name)") as (format_flags: GPUShaderFormat, debug_mode: boolean, name: string | null) => GPUDevicePtr | null;
export const sdlDestroyGPUDevice = sdl3.func("void SDL_DestroyGPUDevice(SDL_GPUDevice* device)") as (device: GPUDevicePtr) => void;
export const sdlGetNumGPUDrivers = sdl3.func("int SDL_GetNumGPUDrivers()") as () => number;
export const sdlGetGPUDriver = sdl3.func("const char* SDL_GetGPUDriver(int index)") as (index: number) => string;
export const sdlGetGPUDeviceDriver = sdl3.func("const char* SDL_GetGPUDeviceDriver(SDL_GPUDevice* device)") as (device: GPUDevicePtr) => string;
export const sdlGetGPUShaderFormats = sdl3.func("SDL_GPUShaderFormat SDL_GetGPUShaderFormats(SDL_GPUDevice* device)") as (device: GPUDevicePtr) => GPUShaderFormat;
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
export const sdlSubmitGPUCommandBufferAndAcquireFence = sdl3.func("SDL_GPUFence* SDL_SubmitGPUCommandBufferAndAcquireFence(SDL_GPUCommandBuffer* command_buffer)") as (command_buffer: GPUCommandBufferPtr) => GPUFencePtr | null;
export const sdlQueryGPUFence = sdl3.func("bool SDL_QueryGPUFence(SDL_GPUDevice* device, SDL_GPUFence* fence)") as (device: GPUDevicePtr, fence: GPUFencePtr) => boolean;
export const sdlReleaseGPUFence = sdl3.func("void SDL_ReleaseGPUFence(SDL_GPUDevice* device, SDL_GPUFence* fence)") as (device: GPUDevicePtr, fence: GPUFencePtr) => void;

const SDL_WaitForGPUFences = sdl3.func("bool SDL_WaitForGPUFences(SDL_GPUDevice* device, bool wait_all, _In_ SDL_GPUFence** fences, uint32 num_fences)");

export function sdlWaitForGPUFences(device: GPUDevicePtr, wait_all: boolean, fences: Array<GPUFencePtr>): boolean {
    if (fences.length === 0) {
        throw new Error("sdlWaitForGPUFences: fences must not be empty");
    }

    return SDL_WaitForGPUFences(device, wait_all, fences, fences.length) as boolean;
}

export const sdlGetGPUSwapchainTextureFormat = sdl3.func("SDL_GPUTextureFormat SDL_GetGPUSwapchainTextureFormat(SDL_GPUDevice* device, SDL_Window* window)") as (device: GPUDevicePtr, window: WindowPtr) => GPUTextureFormat;
export const sdlCreateGPUBuffer = sdl3.func("SDL_GPUBuffer* SDL_CreateGPUBuffer(SDL_GPUDevice* device, _In_ const SDL_GPUBufferCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUBufferCreateInfo) => GPUBufferPtr | null;
export const sdlCreateGPUTransferBuffer = sdl3.func("SDL_GPUTransferBuffer* SDL_CreateGPUTransferBuffer(SDL_GPUDevice* device, _In_ const SDL_GPUTransferBufferCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUTransferBufferCreateInfo) => GPUTransferBufferPtr | null;
export const sdlCreateGPUShader = sdl3.func("SDL_GPUShader* SDL_CreateGPUShader(SDL_GPUDevice* device, _In_ const SDL_GPUShaderCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUShaderCreateInfo) => GPUShaderPtr | null;
export const sdlCreateGPUGraphicsPipeline = sdl3.func("SDL_GPUGraphicsPipeline* SDL_CreateGPUGraphicsPipeline(SDL_GPUDevice* device, _In_ const SDL_GPUGraphicsPipelineCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUGraphicsPipelineCreateInfo) => GPUGraphicsPipelinePtr | null;
export const sdlReleaseGPUBuffer = sdl3.func("void SDL_ReleaseGPUBuffer(SDL_GPUDevice* device, SDL_GPUBuffer* buffer)") as (device: GPUDevicePtr, buffer: GPUBufferPtr) => void;
export const sdlReleaseGPUTransferBuffer = sdl3.func("void SDL_ReleaseGPUTransferBuffer(SDL_GPUDevice* device, SDL_GPUTransferBuffer* transfer_buffer)") as (device: GPUDevicePtr, transfer_buffer: GPUTransferBufferPtr) => void;
export const sdlReleaseGPUShader = sdl3.func("void SDL_ReleaseGPUShader(SDL_GPUDevice* device, SDL_GPUShader* shader)") as (device: GPUDevicePtr, shader: GPUShaderPtr) => void;
export const sdlReleaseGPUGraphicsPipeline = sdl3.func("void SDL_ReleaseGPUGraphicsPipeline(SDL_GPUDevice* device, SDL_GPUGraphicsPipeline* pipeline)") as (device: GPUDevicePtr, pipeline: GPUGraphicsPipelinePtr) => void;

const SDL_MapGPUTransferBuffer = sdl3.func("void* SDL_MapGPUTransferBuffer(SDL_GPUDevice* device, SDL_GPUTransferBuffer* transfer_buffer, bool cycle)");

export function sdlMapGPUTransferBuffer(device: GPUDevicePtr, buffer: GPUTransferBufferPtr, size: number, cycle: boolean): ArrayBuffer | null {
    if (size === 0) {
        throw new Error("sdlMapGPUTransferBuffer: size must match the initial transfer buffer size");
    }

    const ptr = SDL_MapGPUTransferBuffer(device, buffer, cycle);
    if (ptr !== null) {
        return view(ptr, size);
    }

    return null;
}

export const sdlUnmapGPUTransferBuffer = sdl3.func("void SDL_UnmapGPUTransferBuffer(SDL_GPUDevice* device, SDL_GPUTransferBuffer* transfer_buffer)") as (device: GPUDevicePtr, transfer_buffer: GPUTransferBufferPtr) => void;
export const sdlBeginGPUCopyPass = sdl3.func("SDL_GPUCopyPass* SDL_BeginGPUCopyPass(SDL_GPUCommandBuffer* command_buffer)") as (command_buffer: GPUCommandBufferPtr) => GPUCopyPassPtr;
export const sdlUploadToGPUBuffer = sdl3.func("void SDL_UploadToGPUBuffer(SDL_GPUCopyPass* copy_pass, _In_ const SDL_GPUTransferBufferLocation* source, _In_ const SDL_GPUBufferRegion* destination, bool cycle)") as (copy_pass: GPUCopyPassPtr, source: GPUTransferBufferLocation, destination: GPUBufferRegion, cycle: boolean) => void;
export const sdlDownloadFromGPUBuffer = sdl3.func("void SDL_DownloadFromGPUBuffer(SDL_GPUCopyPass* copy_pass, _In_ const SDL_GPUBufferRegion* source, _In_ const SDL_GPUTransferBufferLocation* destination)") as (copy_pass: GPUCopyPassPtr, source: GPUBufferRegion, destination: GPUTransferBufferLocation) => void;
export const sdlCopyGPUBufferToBuffer = sdl3.func("void SDL_CopyGPUBufferToBuffer(SDL_GPUCopyPass* copy_pass, const SDL_GPUBufferLocation* source, const SDL_GPUBufferLocation* destination, uint32 size, bool cycle)") as (copy_pass: GPUCopyPassPtr, source: GPUBufferLocation, destination: GPUBufferLocation, size: number, cycle: boolean) => void;
export const sdlEndGPUCopyPass = sdl3.func("void SDL_EndGPUCopyPass(SDL_GPUCopyPass* copy_pass)") as (copy_pass: GPUCopyPassPtr) => void;
export const sdlBindGPUGraphicsPipeline = sdl3.func("void SDL_BindGPUGraphicsPipeline(SDL_GPURenderPass* render_pass, SDL_GPUGraphicsPipeline* graphics_pipeline)") as (render_pass: GPURenderPassPtr, graphics_pipeline: GPUGraphicsPipelinePtr) => void;

const SDL_BindGPUVertexBuffers = sdl3.func("void SDL_BindGPUVertexBuffers(SDL_GPURenderPass* render_pass, uint32 first_slot, const SDL_GPUBufferBinding* bindings, uint32 num_bindings)");

export function sdlBindGPUVertexBuffers(render_pass: GPURenderPassPtr, first_slot: number, bindings: GPUBufferBinding[]): void {
    SDL_BindGPUVertexBuffers(render_pass, first_slot, bindings, bindings.length);
}

export const sdlDrawGPUPrimitives = sdl3.func("void SDL_DrawGPUPrimitives(SDL_GPURenderPass* render_pass, uint32 num_vertices, uint32 num_instances, uint32 first_vertex, uint32 first_instance)") as (render_pass: GPURenderPassPtr, num_vertices: number, num_instances: number, first_vertex: number, first_instance: number) => void;
