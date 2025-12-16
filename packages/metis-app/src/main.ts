import {
    Device,
    EventType,
    GPUBlendFactor,
    GPUBlendOp,
    GPUBufferUsageFlags,
    GPUColorComponentFlags,
    GPUCompareOp,
    GPUCullMode,
    GPUFillMode,
    GPUFrontFace,
    GPULoadOp,
    GPUPrimitiveType,
    GPUSampleCount,
    GPUShaderFormat,
    GPUShaderStage,
    GPUStencilOp,
    GPUStoreOp,
    GPUTextureFormat,
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
    num_samplers: 0,
    num_storage_buffers: 0,
    num_storage_textures: 0,
    num_uniform_buffers: 0,
});

using fragmentShader = dev.createShader({
    code: triangle.fragment!.spirv,
    code_size: triangle.fragment!.spirv.length,
    entrypoint: "fs_main",
    format: GPUShaderFormat.SPIRV,
    stage: GPUShaderStage.Fragment,
    num_samplers: 0,
    num_storage_buffers: 0,
    num_storage_textures: 0,
    num_uniform_buffers: 0,
});

const bufferSize = 8 * Float32Array.BYTES_PER_ELEMENT * 3;
using buffer = dev.createBuffer({
    usage: GPUBufferUsageFlags.Vertex,
    size: bufferSize,
});
{
    using transfer = dev.createTransferBuffer({
        usage: GPUTransferBufferUsage.Upload,
        size: bufferSize,
    });
    transfer.map(array_buffer => {
        const array = new Float32Array(array_buffer);
        array.set([
            //x   y   z  w  r  g  b  a
            -.5, -.5, 0, 1, 1, 0, 0, 1,
            0.5, -.5, 0, 1, 0, 1, 0, 1,
            0.5, 0.5, 0, 1, 0, 0, 1, 1,
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
    copy.end();

    using fence = cb.submitWithFence(dev);
    fence.wait();
}

using pipeline = dev.createGraphicsPipeline({
    vertex_shader: vertexShader.raw,
    fragment_shader: fragmentShader.raw,
    vertex_input_state: {
        num_vertex_buffers: 1,
        vertex_buffer_descriptions: [
            {
                slot: 0,
                pitch: 8 * Float32Array.BYTES_PER_ELEMENT,
                input_rate: GPUVertexInputRate.Vertex,
                instance_step_rate: 0,
            },
        ],
        num_vertex_attributes: 2,
        vertex_attributes: [
            {
                location: 0,
                buffer_slot: 0,
                format: GPUVertexElementFormat.FLOAT4,
                offset: 0,
            },
            {
                location: 1,
                buffer_slot: 0,
                format: GPUVertexElementFormat.FLOAT4,
                offset: 4 * Float32Array.BYTES_PER_ELEMENT,
            },
        ],
    },
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
                format: dev.getSwapchainFormat(wnd),
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
    pass.drawPrimitives(3);
    pass.end();

    if (!cb.submit()) {
        console.log(`Failed to submit command buffer : ${sdlGetError()}`);
    }
}

dev.releaseWindow(wnd);
