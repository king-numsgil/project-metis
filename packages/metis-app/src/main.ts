import {
    Device,
    EventType,
    GPUBufferUsageFlags,
    GPULoadOp,
    GPUStoreOp,
    GPUTransferBufferUsage,
    Keymod,
    Scancode,
    ShaderFormat,
    System,
    Window
} from "sdl3";
import { sdlGetError } from "sdl3/ffi";

import triangle from "./triangle.wgsl";
import * as console from "node:console";

console.log(triangle.vertex);

function decodeKeymods(mod: Keymod): string[] {
    return (Object.keys(Keymod) as Array<keyof typeof Keymod>)
        .filter(key => isNaN(Number(key))) // strip reverse numeric mappings
        .filter(key => {
            const value = Keymod[key];
            return value !== 0 && (mod & value) === value;
        });
}

using sys = new System();
console.log(`Platform: ${sys.platform}`);

using wnd = Window.create("SDL Experiment", 1440, 768);
console.log(`WindowID: ${wnd.windowID}`);

console.log("Supported GPU drivers :", Device.listSupportedDrivers());

using dev = new Device(ShaderFormat.SPIRV | ShaderFormat.MSL, true);
dev.claimWindow(wnd);
console.log(`Device Driver : ${dev.driver}`);
console.log(`Device Shader Format : ${ShaderFormat[dev.shader_formats]}`);

using buffer = dev.createBuffer({
    usage: GPUBufferUsageFlags.Vertex,
    size: 3 * Float32Array.BYTES_PER_ELEMENT,
});
{
    using transfer = dev.createTransferBuffer({
        usage: GPUTransferBufferUsage.Upload,
        size: 3 * Float32Array.BYTES_PER_ELEMENT,
    });
    transfer.map(array_buffer => {
        const array = new Float32Array(array_buffer);
        array[0] = 1.0;
        array[1] = 2.0;
        array[2] = 3.0;
    });

    const cb = dev.acquireCommandBuffer();
    const copy = cb.beginCopyPass();
    copy.uploadToDeviceBuffer({
        transfer_buffer: transfer.raw,
        offset: 0,
    }, {
        buffer: buffer.raw,
        offset: 0,
        size: 3 * Float32Array.BYTES_PER_ELEMENT,
    });
    copy.end();

    using fence = cb.submitWithFence(dev);
    console.log(`Fence Wait : ${fence.wait()}`);
}

let running = true;
while (running) {
    for (const e of sys.events()) {
        switch (e.type) {
            case EventType.Quit:
                running = false;
                console.log(`Got Quit event at ${e.quit.timestamp}`);
                break;
            case EventType.KeyDown:
                console.log(`Got KeyDown event at ${e.key.timestamp} with ${Scancode[e.key.scancode]} (${decodeKeymods(e.key.mod).join(" | ")})`);
                break;
        }
    }

    const cb = dev.acquireCommandBuffer();
    const swapchain = cb.waitAndAcquireSwapchainTexture(wnd);
    const pass = cb.beginRenderPass([{
        texture: swapchain.texture,
        clear_color: {r: 0.3, g: 0.4, b: 0.5, a: 1.0},
        load_op: GPULoadOp.Clear,
        store_op: GPUStoreOp.Store,
    }], null);
    pass.end();

    if (!cb.submit()) {
        console.log(`Failed to submit command buffer : ${sdlGetError()}`);
    }
}

{
    using transfer = dev.createTransferBuffer({
        usage: GPUTransferBufferUsage.Download,
        size: 3 * Float32Array.BYTES_PER_ELEMENT,
    });

    const cb = dev.acquireCommandBuffer();
    const copy = cb.beginCopyPass();
    copy.downloadFromDeviceBuffer({
        buffer: buffer.raw,
        offset: 0,
        size: 3 * Float32Array.BYTES_PER_ELEMENT,
    }, {
        transfer_buffer: transfer.raw,
        offset: 0,
    });
    copy.end();

    using fence = cb.submitWithFence(dev);
    console.log(`Fence Wait : ${fence.wait()}`);

    transfer.map(array_buffer => {
        const array = new Float32Array(array_buffer);
        console.log(array);
    });
}

dev.releaseWindow(wnd);
