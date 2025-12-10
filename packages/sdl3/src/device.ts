import {type GPUBufferCreateInfo, type GPUTransferBufferCreateInfo, ShaderFormat} from "sdl3";
import {
    type GPUDevicePtr,
    sdlAcquireGPUCommandBuffer,
    sdlClaimWindowForGPUDevice,
    sdlCreateGPUBuffer,
    sdlCreateGPUDevice,
    sdlCreateGPUTransferBuffer,
    sdlDestroyGPUDevice,
    sdlGetError,
    sdlGetGPUDeviceDriver,
    sdlGetGPUDriver,
    sdlGetGPUShaderFormats,
    sdlGetNumGPUDrivers,
    sdlReleaseWindowFromGPUDevice,
    sdlWaitForGPUFences,
} from "./ffi";

import {TransferBuffer} from "./transfer_buffer.ts";
import {CommandBuffer} from "./command_buffer.ts";
import {DeviceBuffer} from "./device_buffer.ts";
import type {Window} from "./window.ts";
import {Fence} from "./fence.ts";

export class Device {
    private readonly handle: GPUDevicePtr;

    public static listSupportedDrivers(): string[] {
        let list: string[] = [];
        for (let i = 0; i < sdlGetNumGPUDrivers(); i++) {
            list = [...list, sdlGetGPUDriver(i)];
        }

        return list;
    }

    public constructor(format_flags: ShaderFormat, debug_mode: boolean, name: string | null = null) {
        const handle = sdlCreateGPUDevice(format_flags, debug_mode, name);
        if (!handle) {
            throw new Error("Failed to create GPUDevice");
        }
        this.handle = handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlDestroyGPUDevice(this.handle);
    }

    public get raw(): GPUDevicePtr {
        return this.handle;
    }

    public get driver(): string {
        return sdlGetGPUDeviceDriver(this.handle);
    }

    public get shader_formats(): ShaderFormat {
        return sdlGetGPUShaderFormats(this.handle);
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
