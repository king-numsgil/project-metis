import {
    DefaultGraphicsPipelineCreateInfo,
    Device,
    EventType,
    GPUBufferUsageFlags,
    GPUIndexElementSize,
    GPULoadOp,
    GPUPrimitiveType,
    GPUShaderFormat,
    GPUShaderStage,
    GPUStoreOp,
    GPUTransferBufferUsage,
    GPUVertexElementFormat,
    GPUVertexInputRate,
    Keymod,
    Scancode,
    System,
    Window
} from "sdl3";
import { sdlGetError } from "sdl3/ffi";

import triangle from "./triangle.wgsl";

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

using dev = new Device(GPUShaderFormat.SPIRV | GPUShaderFormat.MSL, true);
dev.claimWindow(wnd);
console.log(`Device Driver : ${dev.driver}`);
console.log(`Device Shader Format : ${GPUShaderFormat[dev.shader_formats]}`);

using vertexShader = dev.createShader({
    code: triangle.vertex!.spirv,
    code_size: triangle.vertex!.spirv.length,
    entrypoint: "vs_main",
    format: GPUShaderFormat.SPIRV,
    stage: GPUShaderStage.Vertex,
});

using fragmentShader = dev.createShader({
    code: triangle.fragment!.spirv,
    code_size: triangle.fragment!.spirv.length,
    entrypoint: "fs_main",
    format: GPUShaderFormat.SPIRV,
    stage: GPUShaderStage.Fragment,
});

const bufferSize = 5 * Float32Array.BYTES_PER_ELEMENT * 4;
using buffer = dev.createBuffer({
    usage: GPUBufferUsageFlags.Vertex,
    size: bufferSize,
});

const indexSize = 6 * Uint16Array.BYTES_PER_ELEMENT;
using indexBuffer = dev.createBuffer({
    usage: GPUBufferUsageFlags.Index,
    size: indexSize,
});
{
    using transfer = dev.createTransferBuffer({
        usage: GPUTransferBufferUsage.Upload,
        size: bufferSize,
    });
    transfer.map(array_buffer => {
        const array = new Float32Array(array_buffer);
        array.set([
            //x   y   r  g  b
            -.5, -.5, 1, 0, 0,
            0.5, -.5, 0, 1, 0,
            0.5, 0.5, 0, 0, 1,
            -.5, 0.5, 1, 0, 1,
        ]);
    });

    using indexTransfer = dev.createTransferBuffer({
        usage: GPUTransferBufferUsage.Upload,
        size: indexSize,
    });
    indexTransfer.map(array_buffer => {
        const array = new Uint16Array(array_buffer);
        array.set([
            0, 1, 2,
            0, 2, 3,
        ]);
    });

    const cb = dev.acquireCommandBuffer();
    const copy = cb.beginCopyPass();
    copy.uploadToDeviceBuffer({
        transfer_buffer: transfer.raw,
        offset: 0,
    }, {
        buffer: buffer.raw,
        offset: 0,
        size: bufferSize,
    });
    copy.uploadToDeviceBuffer({
        transfer_buffer: indexTransfer.raw,
        offset: 0,
    }, {
        buffer: indexBuffer.raw,
        offset: 0,
        size: indexSize,
    });
    copy.end();

    using fence = cb.submitWithFence(dev);
    fence.wait();
}

using pipeline = dev.createGraphicsPipeline({
    ...DefaultGraphicsPipelineCreateInfo,
    vertex_shader: vertexShader.raw,
    fragment_shader: fragmentShader.raw,
    vertex_input_state: {
        num_vertex_buffers: 1,
        vertex_buffer_descriptions: [
            {
                slot: 0,
                pitch: 5 * Float32Array.BYTES_PER_ELEMENT,
                input_rate: GPUVertexInputRate.Vertex,
                instance_step_rate: 0,
            },
        ],
        num_vertex_attributes: 2,
        vertex_attributes: [
            {
                location: 0,
                buffer_slot: 0,
                format: GPUVertexElementFormat.FLOAT2,
                offset: 0,
            },
            {
                location: 1,
                buffer_slot: 0,
                format: GPUVertexElementFormat.FLOAT3,
                offset: 2 * Float32Array.BYTES_PER_ELEMENT,
            },
        ],
    },
    target_info: {
        ...DefaultGraphicsPipelineCreateInfo.target_info,
        color_target_descriptions: [
            {
                ...DefaultGraphicsPipelineCreateInfo.target_info.color_target_descriptions[0]!,
                format: dev.getSwapchainFormat(wnd),
            },
        ],
    },
    primitive_type: GPUPrimitiveType.TriangleList,
});

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
    pass.bindGraphicsPipeline(pipeline);
    pass.bindVertexBuffers([
        {
            buffer: buffer.raw,
            offset: 0,
        },
    ]);
    pass.bindIndexBuffer({
        buffer: indexBuffer.raw,
        offset: 0,
    }, GPUIndexElementSize.Size16Bit);
    pass.drawIndexedPrimitives(6);
    pass.end();

    if (!cb.submit()) {
        console.log(`Failed to submit command buffer : ${sdlGetError()}`);
    }
}

dev.releaseWindow(wnd);
