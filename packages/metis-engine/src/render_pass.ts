import { type GPURenderPassPtr, sdlEndGPURenderPass } from "sdl-ffi";

export class RenderPass {
    public constructor(private readonly handle: GPURenderPassPtr) {
    }

    public get raw(): GPURenderPassPtr {
        return this.handle;
    }

    public end(): void {
        sdlEndGPURenderPass(this.handle);
    }
}