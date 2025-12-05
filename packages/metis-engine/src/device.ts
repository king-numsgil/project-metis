import {
    type GPUDevicePtr,
    sdlAcquireGPUCommandBuffer,
    sdlClaimWindowForGPUDevice,
    sdlCreateGPUDevice,
    sdlDestroyGPUDevice,
    sdlGetError,
    sdlGetGPUDeviceDriver, sdlGetGPUDriver,
    sdlGetGPUShaderFormats, sdlGetNumGPUDrivers,
    sdlReleaseWindowFromGPUDevice,
    ShaderFormat,
} from "sdl-ffi";

import type { Window } from "./window.ts";
import { CommandBuffer } from "./command_buffer.ts";

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
}
