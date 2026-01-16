import { view } from "koffi";

import {
    type GPUBufferBinding,
    type GPUBufferCreateInfo,
    type GPUBufferLocation,
    type GPUBufferPtr,
    type GPUBufferRegion,
    type GPUColorTargetInfo,
    type GPUCommandBufferPtr,
    type GPUComputePassPtr,
    type GPUComputePipelineCreateInfo,
    type GPUComputePipelinePtr,
    type GPUCopyPassPtr,
    type GPUDepthStencilTargetInfo,
    type GPUDevicePtr,
    type GPUFencePtr,
    type GPUGraphicsPipelineCreateInfo,
    type GPUGraphicsPipelinePtr,
    GPUIndexElementSize,
    type GPURenderPassPtr,
    type GPUSamplerCreateInfo,
    type GPUSamplerPtr,
    type GPUShaderCreateInfo,
    GPUShaderFormat,
    type GPUShaderPtr,
    type GPUStorageBufferReadWriteBinding,
    type GPUStorageTextureReadWriteBinding,
    type GPUTextureCreateInfo,
    GPUTextureFormat,
    type GPUTexturePtr,
    type GPUTextureSamplerBinding,
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
export const sdlCreateGPUTexture = sdl3.func("SDL_GPUTexture* SDL_CreateGPUTexture(SDL_GPUDevice* device, _In_ const SDL_GPUTextureCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUTextureCreateInfo) => GPUTexturePtr | null;
export const sdlCreateGPUSampler = sdl3.func("SDL_GPUSampler* SDL_CreateGPUSampler(SDL_GPUDevice* device, _In_ const SDL_GPUSamplerCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUSamplerCreateInfo) => GPUSamplerPtr | null;
export const sdlCreateGPUGraphicsPipeline = sdl3.func("SDL_GPUGraphicsPipeline* SDL_CreateGPUGraphicsPipeline(SDL_GPUDevice* device, _In_ const SDL_GPUGraphicsPipelineCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUGraphicsPipelineCreateInfo) => GPUGraphicsPipelinePtr | null;
export const sdlCreateGPUComputePipeline = sdl3.func("SDL_GPUComputePipeline* SDL_CreateGPUComputePipeline(SDL_GPUDevice* device, const SDL_GPUComputePipelineCreateInfo* createinfo)") as (device: GPUDevicePtr, createinfo: GPUComputePipelineCreateInfo) => GPUComputePipelinePtr | null;
export const sdlReleaseGPUBuffer = sdl3.func("void SDL_ReleaseGPUBuffer(SDL_GPUDevice* device, SDL_GPUBuffer* buffer)") as (device: GPUDevicePtr, buffer: GPUBufferPtr) => void;
export const sdlReleaseGPUTransferBuffer = sdl3.func("void SDL_ReleaseGPUTransferBuffer(SDL_GPUDevice* device, SDL_GPUTransferBuffer* transfer_buffer)") as (device: GPUDevicePtr, transfer_buffer: GPUTransferBufferPtr) => void;
export const sdlReleaseGPUShader = sdl3.func("void SDL_ReleaseGPUShader(SDL_GPUDevice* device, SDL_GPUShader* shader)") as (device: GPUDevicePtr, shader: GPUShaderPtr) => void;
export const sdlReleaseGPUTexture = sdl3.func("void SDL_ReleaseGPUTexture(SDL_GPUDevice* device, SDL_GPUTexture* texture)") as (device: GPUDevicePtr, texture: GPUTexturePtr) => void;
export const sdlReleaseGPUSampler = sdl3.func("void SDL_ReleaseGPUSampler(SDL_GPUDevice* device, SDL_GPUSampler* sampler)") as (device: GPUDevicePtr, sampler: GPUSamplerPtr) => void;
export const sdlReleaseGPUGraphicsPipeline = sdl3.func("void SDL_ReleaseGPUGraphicsPipeline(SDL_GPUDevice* device, SDL_GPUGraphicsPipeline* pipeline)") as (device: GPUDevicePtr, pipeline: GPUGraphicsPipelinePtr) => void;
export const sdlReleaseGPUComputePipeline = sdl3.func("void SDL_ReleaseGPUComputePipeline(SDL_GPUDevice* device, SDL_GPUComputePipeline* compute_pipeline)") as (device: GPUDevicePtr, compute_pipeline: GPUComputePipelinePtr) => void;

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

const SDL_BindGPUVertexSamplers = sdl3.func("void SDL_BindGPUVertexSamplers(SDL_GPURenderPass* render_pass, uint32 first_slot, _In_ const SDL_GPUTextureSamplerBinding* texture_sampler_bindings, uint32 num_bindings)");

export function sdlBindGPUVertexSamplers(render_pass: GPURenderPassPtr, first_slot: number, texture_sampler_bindings: GPUTextureSamplerBinding[]): void {
    SDL_BindGPUVertexSamplers(render_pass, first_slot, texture_sampler_bindings, texture_sampler_bindings.length);
}

const SDL_BindGPUVertexStorageTextures = sdl3.func("void SDL_BindGPUVertexSamplers(SDL_GPURenderPass* render_pass, uint32 first_slot, _In_ const SDL_GPUTexture** storage_textures, uint32 num_bindings)");

export function sdlBindGPUVertexStorageTextures(render_pass: GPURenderPassPtr, first_slot: number, storage_textures: GPUTexturePtr[]): void {
    SDL_BindGPUVertexStorageTextures(render_pass, first_slot, storage_textures, storage_textures.length);
}

const SDL_BindGPUVertexStorageBuffers = sdl3.func("void SDL_BindGPUVertexBuffers(SDL_GPURenderPass* render_pass, uint32 first_slot, _In_ const SDL_GPUBuffer** storage_buffers, uint32 num_bindings)");

export function sdlBindGPUVertexStorageBuffers(render_pass: GPURenderPassPtr, first_slot: number, storage_buffers: GPUBufferPtr[]): void {
    SDL_BindGPUVertexStorageBuffers(render_pass, first_slot, storage_buffers, storage_buffers.length);
}

const SDL_BindGPUFragmentSamplers = sdl3.func("void SDL_BindGPUFragmentSamplers(SDL_GPURenderPass* render_pass, uint32 first_slot, _In_ const SDL_GPUTextureSamplerBinding* texture_sampler_bindings, uint32 num_bindings)");

export function sdlBindGPUFragmentSamplers(render_pass: GPURenderPassPtr, first_slot: number, texture_sampler_bindings: GPUTextureSamplerBinding[]): void {
    SDL_BindGPUFragmentSamplers(render_pass, first_slot, texture_sampler_bindings, texture_sampler_bindings.length);
}

const SDL_BindGPUFragmentStorageTextures = sdl3.func("void SDL_BindGPUFragmentStorageTextures(SDL_GPURenderPass* render_pass, uint32 first_slot, _In_ const SDL_GPUTexture** storage_textures, uint32 num_bindings)");

export function sdlBindGPUFragmentStorageTextures(render_pass: GPURenderPassPtr, first_slot: number, storage_textures: GPUTexturePtr[]): void {
    SDL_BindGPUFragmentStorageTextures(render_pass, first_slot, storage_textures, storage_textures.length);
}

const SDL_BindGPUFragmentStorageBuffers = sdl3.func("void SDL_BindGPUVertexBuffers(SDL_GPURenderPass* render_pass, uint32 first_slot, _In_ const SDL_GPUBuffer** storage_buffers, uint32 num_bindings)");

export function sdlBindGPUFragmentStorageBuffers(render_pass: GPURenderPassPtr, first_slot: number, storage_buffers: GPUBufferPtr[]): void {
    SDL_BindGPUFragmentStorageBuffers(render_pass, first_slot, storage_buffers, storage_buffers.length);
}

export const sdlBindGPUIndexBuffer = sdl3.func("void SDL_BindGPUIndexBuffer(SDL_GPURenderPass* render_pass, const SDL_GPUBufferBinding* binding, SDL_GPUIndexElementSize index_element_size)") as (render_pass: GPURenderPassPtr, binding: GPUBufferBinding, index_element_size: GPUIndexElementSize) => void;
export const sdlDrawGPUIndexedPrimitives = sdl3.func("void SDL_DrawGPUIndexedPrimitives(SDL_GPURenderPass* render_pass, uint32 num_indices, uint32 num_instances, uint32 first_index, int32 vertex_offset, uint32 first_instance)") as (render_pass: GPURenderPassPtr, num_indices: number, num_instances: number, first_index: number, vertex_offset: number, first_instance: number) => void;
export const sdlDrawGPUPrimitives = sdl3.func("void SDL_DrawGPUPrimitives(SDL_GPURenderPass* render_pass, uint32 num_vertices, uint32 num_instances, uint32 first_vertex, uint32 first_instance)") as (render_pass: GPURenderPassPtr, num_vertices: number, num_instances: number, first_vertex: number, first_instance: number) => void;

const SDL_PushGPUVertexUniformData = sdl3.func("void SDL_PushGPUVertexUniformData(SDL_GPUCommandBuffer* command_buffer, uint32 slot_index, const void* data, uint32 length)");

export function sdlPushGPUVertexUniformData(command_buffer: GPUCommandBufferPtr, slot_index: number, data: ArrayBuffer): void {
    SDL_PushGPUVertexUniformData(command_buffer, slot_index, data, data.byteLength);
}

const SDL_PushGPUFragmentUniformData = sdl3.func("void SDL_PushGPUFragmentUniformData(SDL_GPUCommandBuffer* command_buffer, uint32 slot_index, const void* data, uint32 length)");

export function sdlPushGPUFragmentUniformData(command_buffer: GPUCommandBufferPtr, slot_index: number, data: ArrayBuffer): void {
    SDL_PushGPUFragmentUniformData(command_buffer, slot_index, data, data.byteLength);
}

const SDL_PushGPUComputeUniformData = sdl3.func("void SDL_PushGPUComputeUniformData(SDL_GPUCommandBuffer* command_buffer, uint32 slot_index, const void* data, uint32 length)");

export function sdlPushGPUComputeUniformData(command_buffer: GPUCommandBufferPtr, slot_index: number, data: ArrayBuffer): void {
    SDL_PushGPUComputeUniformData(command_buffer, slot_index, data, data.byteLength);
}

const SDL_BeginGPUComputePass = sdl3.func("SDL_GPUComputePass* SDL_BeginGPUComputePass(SDL_GPUCommandBuffer *command_buffer, const SDL_GPUStorageTextureReadWriteBinding *storage_texture_bindings, uint32 num_storage_texture_bindings, const SDL_GPUStorageBufferReadWriteBinding *storage_buffer_bindings, uint32 num_storage_buffer_bindings)");

export function sdlBeginGPUComputePass(command_buffer: GPUCommandBufferPtr, storage_texture_bindings?: GPUStorageTextureReadWriteBinding[] | null, storage_buffer_bindings?: GPUStorageBufferReadWriteBinding[] | null): GPUComputePassPtr {
    return SDL_BeginGPUComputePass(
        command_buffer,
        storage_texture_bindings ?? null,
        storage_texture_bindings?.length ?? 0,
        storage_buffer_bindings ?? null,
        storage_buffer_bindings?.length ?? 0,
    ) as GPUComputePassPtr;
}

export const sdlDispatchGPUCompute = sdl3.func("void SDL_DispatchGPUCompute(SDL_GPUComputePass* compute_pass, uint32 groupcount_x, uint32 groupcount_y, uint32 groupcount_z)") as (compute_pass: GPUComputePassPtr, groupcount_x: number, groupcount_y: number, groupcount_z: number) => void;
export const sdlEndGPUComputePass = sdl3.func("void SDL_EndGPUComputePass(SDL_GPUComputePass* compute_pass)") as (compute_pass: GPUComputePassPtr) => void;
export const sdlBindGPUComputePipeline = sdl3.func("void SDL_BindGPUComputePipeline(SDL_GPUComputePass* compute_pass, SDL_GPUComputePipeline* compute_pipeline)") as (compute_pass: GPUComputePassPtr, compute_pipeline: GPUComputePipelinePtr) => void;

const SDL_BindGPUComputeSamplers = sdl3.func("void SDL_BindGPUComputeSamplers(SDL_GPUComputePass* compute_pass, uint32 first_slot, _In_ const SDL_GPUTextureSamplerBinding* texture_sampler_bindings, uint32 num_bindings)");

export function sdlBindGPUComputeSamplers(compute_pass: GPUComputePassPtr, first_slot: number, texture_sampler_bindings: GPUTextureSamplerBinding[]): void {
    SDL_BindGPUComputeSamplers(compute_pass, first_slot, texture_sampler_bindings, texture_sampler_bindings.length);
}

const SDL_BindGPUComputeStorageTextures = sdl3.func("void SDL_BindGPUComputeStorageTextures(SDL_GPUComputePass* compute_pass, uint32 first_slot, _In_ const SDL_GPUTexture** storage_textures, uint32 num_bindings)");

export function sdlBindGPUComputeStorageTextures(compute_pass: GPUComputePassPtr, first_slot: number, storage_textures: GPUTexturePtr[]): void {
    SDL_BindGPUComputeStorageTextures(compute_pass, first_slot, storage_textures, storage_textures.length);
}

const SDL_BindGPUComputeStorageBuffers = sdl3.func("void SDL_BindGPUComputeStorageBuffers(SDL_GPUComputePass* compute_pass, uint32 first_slot, _In_ const SDL_GPUBuffer** storage_buffers, uint32 num_bindings)");

export function sdlBindGPUComputeStorageBuffers(compute_pass: GPUComputePassPtr, first_slot: number, storage_buffers: GPUBufferPtr[]): void {
    SDL_BindGPUComputeStorageBuffers(compute_pass, first_slot, storage_buffers, storage_buffers.length);
}
