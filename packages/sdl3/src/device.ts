import {
    GPUBlendFactor,
    GPUBlendOp,
    type GPUBufferCreateInfo,
    GPUColorComponentFlags,
    GPUCompareOp,
    GPUCullMode,
    GPUFillMode,
    GPUFrontFace,
    type GPUGraphicsPipelineCreateInfo,
    GPUPrimitiveType,
    GPUSampleCount,
    type GPUShaderCreateInfo,
    GPUShaderFormat,
    GPUStencilOp,
    GPUTextureFormat,
    type GPUTransferBufferCreateInfo
} from "sdl3";

import {
    type GPUDevicePtr,
    sdlAcquireGPUCommandBuffer,
    sdlClaimWindowForGPUDevice,
    sdlCreateGPUBuffer,
    sdlCreateGPUDevice,
    sdlCreateGPUGraphicsPipeline,
    sdlCreateGPUShader,
    sdlCreateGPUTransferBuffer,
    sdlDestroyGPUDevice,
    sdlGetError,
    sdlGetGPUDeviceDriver,
    sdlGetGPUDriver,
    sdlGetGPUShaderFormats,
    sdlGetGPUSwapchainTextureFormat,
    sdlGetNumGPUDrivers,
    sdlReleaseWindowFromGPUDevice,
    sdlWaitForGPUFences,
} from "./ffi";

import { GraphicsPipeline } from "./graphics_pipeline.ts";
import { TransferBuffer } from "./transfer_buffer.ts";
import { CommandBuffer } from "./command_buffer.ts";
import { DeviceBuffer } from "./device_buffer.ts";
import type { Window } from "./window.ts";
import { Shader } from "./shader.ts";
import { Fence } from "./fence.ts";

export const DefaultGraphicsPipelineCreateInfo: Readonly<Omit<GPUGraphicsPipelineCreateInfo, "vertex_shader" | "fragment_shader" | "vertex_input_state">> = Object.freeze({
    rasterizer_state: {
        fill_mode: GPUFillMode.Fill,
        cull_mode: GPUCullMode.None,
        front_face: GPUFrontFace.CounterClockwise,
        depth_bias_clamp: 0,
        depth_bias_constant_factor: 0,
        depth_bias_slope_factor: 0,
        enable_depth_bias: false,
        enable_depth_clip: false,
    },
    target_info: {
        num_color_targets: 1,
        color_target_descriptions: [
            {
                format: GPUTextureFormat.Invalid,
                blend_state: {
                    alpha_blend_op: GPUBlendOp.Invalid,
                    color_blend_op: GPUBlendOp.Invalid,
                    color_write_mask: GPUColorComponentFlags.R | GPUColorComponentFlags.G | GPUColorComponentFlags.B | GPUColorComponentFlags.A,
                    dst_alpha_blendfactor: GPUBlendFactor.Invalid,
                    dst_color_blendfactor: GPUBlendFactor.Invalid,
                    src_alpha_blendfactor: GPUBlendFactor.Invalid,
                    src_color_blendfactor: GPUBlendFactor.Invalid,
                    enable_blend: false,
                    enable_color_write_mask: false,
                },
            },
        ],
        depth_stencil_format: GPUTextureFormat.Invalid,
        has_depth_stencil_target: false,
    },
    depth_stencil_state: {
        back_stencil_state: {
            compare_op: GPUCompareOp.Invalid,
            depth_fail_op: GPUStencilOp.Invalid,
            fail_op: GPUStencilOp.Invalid,
            pass_op: GPUStencilOp.Invalid,
        },
        compare_mask: 0,
        compare_op: GPUCompareOp.Invalid,
        enable_depth_test: false,
        enable_depth_write: false,
        front_stencil_state: {
            pass_op: GPUStencilOp.Invalid,
            fail_op: GPUStencilOp.Invalid,
            depth_fail_op: GPUStencilOp.Invalid,
            compare_op: GPUCompareOp.Invalid,
        },
        enable_stencil_test: false,
        write_mask: 0,
    },
    multisample_state: {
        sample_count: GPUSampleCount.One,
        enable_mask: false,
        sample_mask: 0,
    },
    primitive_type: GPUPrimitiveType.TriangleList,
});

export class Device {
    private readonly handle: GPUDevicePtr;

    public constructor(format_flags: GPUShaderFormat, debug_mode: boolean, name: string | null = null) {
        const handle = sdlCreateGPUDevice(format_flags, debug_mode, name);
        if (!handle) {
            throw new Error("Failed to create GPUDevice");
        }
        this.handle = handle;
    }

    public get raw(): GPUDevicePtr {
        return this.handle;
    }

    public get driver(): string {
        return sdlGetGPUDeviceDriver(this.handle);
    }

    public get shader_formats(): GPUShaderFormat {
        return sdlGetGPUShaderFormats(this.handle);
    }

    public static listSupportedDrivers(): string[] {
        let list: string[] = [];
        for (let i = 0; i < sdlGetNumGPUDrivers(); i++) {
            list = [...list, sdlGetGPUDriver(i)];
        }

        return list;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlDestroyGPUDevice(this.handle);
    }

    public claimWindow(window: Window) {
        const result = sdlClaimWindowForGPUDevice(this.handle, window.raw);
        if (!result) {
            throw new Error(`Failed to claim Window : ${sdlGetError()}`);
        }
    }

    public releaseWindow(window: Window) {
        sdlReleaseWindowFromGPUDevice(this.handle, window.raw);
    }

    public getSwapchainFormat(window: Window): GPUTextureFormat {
        return sdlGetGPUSwapchainTextureFormat(this.handle, window.raw);
    }

    public acquireCommandBuffer(): CommandBuffer {
        const cb = sdlAcquireGPUCommandBuffer(this.handle);
        if (!cb) {
            throw new Error(`Failed to acquire CommandBuffer : ${sdlGetError()}`);
        }

        return new CommandBuffer(cb);
    }

    public waitFences(fences: Array<Fence>, wait_all: boolean = true): boolean {
        return sdlWaitForGPUFences(this.handle, wait_all, fences.map(fence => fence.raw));
    }

    public createShader(create_info: GPUShaderCreateInfo): Shader {
        const s = sdlCreateGPUShader(this.handle, create_info);
        if (!s) {
            throw new Error(`Failed to create Shader : ${sdlGetError()}`);
        }

        return new Shader(s, this);
    }

    public createGraphicsPipeline(create_info: GPUGraphicsPipelineCreateInfo): GraphicsPipeline {
        const gp = sdlCreateGPUGraphicsPipeline(this.handle, create_info);
        if (!gp) {
            throw new Error(`Failed to create GraphicsPipeline : ${sdlGetError()}`);
        }

        return new GraphicsPipeline(gp, this);
    }

    public createBuffer(create_info: GPUBufferCreateInfo): DeviceBuffer {
        const b = sdlCreateGPUBuffer(this.handle, create_info);
        if (!b) {
            throw new Error(`Failed to create DeviceBuffer : ${sdlGetError()}`);
        }

        return new DeviceBuffer(this, b, create_info.size);
    }

    public createTransferBuffer(create_info: GPUTransferBufferCreateInfo): TransferBuffer {
        const tb = sdlCreateGPUTransferBuffer(this.handle, create_info);
        if (!tb) {
            throw new Error(`Failed to create TransferBuffer : ${sdlGetError()}`);
        }

        return new TransferBuffer(this, tb, create_info.size);
    }
}
