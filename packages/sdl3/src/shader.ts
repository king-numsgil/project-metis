import { sdlReleaseGPUShader, type GPUShaderPtr } from "./ffi";
import { Device } from "./device.ts";

export class Shader {
    public constructor(private readonly handle: GPUShaderPtr, private readonly device: Device) {
    }

    public get raw(): GPUShaderPtr {
        return this.handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUShader(this.device.raw, this.handle);
    }
}
