import {
    defaultGraphicsPipelineCreateInfo,
    Device,
    EventType,
    GPUCompareOp,
    GPUFilter,
    GPUIndexElementSize,
    GPULoadOp,
    GPUPrimitiveType,
    GPUSampleCount,
    GPUSamplerAddressMode,
    GPUSamplerMipmapMode,
    GPUShaderFormat,
    GPUStoreOp,
    GPUTextureFormat,
    GPUTextureType,
    GPUTextureUsageFlags,
    GPUVertexInputRate,
    Keymod,
    Mesh,
    Scancode,
    System,
    Window,
} from "sdl3";
import { ArrayOf, F32, StructOf, Vec } from "metis-data";
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

if (!triangle.vertex || !triangle.fragment || !triangle.compute) {
    throw new Error("Failed loading compiled shader");
}

using sys = new System();
console.log(`Platform: ${sys.platform}`);

using wnd = Window.create("SDL Experiment", 1440, 768);
console.log(`WindowID: ${wnd.windowID}`);

console.log("Supported GPU drivers :", Device.listSupportedDrivers());

using dev = new Device(GPUShaderFormat.SPIRV, true);
dev.claimWindow(wnd);
console.log(`Device Driver : ${dev.driver}`);
console.log(`Device Shader Format : ${GPUShaderFormat[dev.shader_formats]}`);

using vertexShader = dev.createShader(triangle.vertex);
using fragmentShader = dev.createShader(triangle.fragment);

const count = Number(4);

const quadBuffer = new Mesh(ArrayOf(StructOf({
    position: Vec(F32, 2),
    uv: Vec(F32, 2),
}), count), 6);
quadBuffer.vertices.at(0).set({
    position: [-.5, -.5],
    uv: [0, 1],
});
quadBuffer.vertices.at(1).set({
    position: [0.5, -.5],
    uv: [1, 1],
});
quadBuffer.vertices.at(2).set({
    position: [0.5, 0.5],
    uv: [1, 0],
});
quadBuffer.vertices.at(3).set({
    position: [-.5, 0.5],
    uv: [0, 0],
});
quadBuffer.setIndices([0, 1, 2, 0, 2, 3]);

using vertexBuffer = quadBuffer.createVertexDeviceBuffer(dev);
using indexBuffer = quadBuffer.createIndexDeviceBuffer(dev);

using computeTexture = dev.createTexture({
    type: GPUTextureType.TwoD,
    format: GPUTextureFormat.R8G8B8A8Unorm,
    usage: GPUTextureUsageFlags.Sampler | GPUTextureUsageFlags.ComputeStorageWrite,
    width: 1440 / 2,
    height: 768 / 2,
    layer_count_or_depth: 1,
    num_levels: 1,
    sample_count: GPUSampleCount.One,
});
using sampler = dev.createSampler({
    min_filter: GPUFilter.Linear,
    mag_filter: GPUFilter.Linear,
    mipmap_mode: GPUSamplerMipmapMode.Linear,
    address_mode_u: GPUSamplerAddressMode.ClampToEdge,
    address_mode_v: GPUSamplerAddressMode.ClampToEdge,
    address_mode_w: GPUSamplerAddressMode.ClampToEdge,
    compare_op: GPUCompareOp.Invalid,
    enable_anisotropy: false,
    enable_compare: false,
    max_lod: 0,
    max_anisotropy: 0,
    min_lod: 0,
    mip_lod_bias: 0,
});

using computePipeline = dev.createComputePipeline(triangle.compute);
using pipeline = dev.createGraphicsPipeline({
    ...defaultGraphicsPipelineCreateInfo,
    vertex_shader: vertexShader.raw,
    fragment_shader: fragmentShader.raw,
    vertex_input_state: {
        num_vertex_buffers: 1,
        vertex_buffer_descriptions: [
            {
                slot: 0,
                pitch: quadBuffer.vertices.type.arrayPitch,
                input_rate: GPUVertexInputRate.Vertex,
                instance_step_rate: 0,
            },
        ],
        num_vertex_attributes: 2,
        vertex_attributes: quadBuffer.getVertexAttributes(0),
    },
    target_info: {
        ...defaultGraphicsPipelineCreateInfo.target_info,
        color_target_descriptions: [
            {
                ...defaultGraphicsPipelineCreateInfo.target_info.color_target_descriptions[0]!,
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

    const computePass = cb.beginComputePass([{
        texture: computeTexture.raw,
        layer: 0,
        mip_level: 0,
        cycle: false,
    }]);
    computePass.bindComputePipeline(computePipeline);
    computePass.dispatch((1440 / 2 + 7) / 8, (768 / 2 + 7) / 8, 1);
    computePass.end();

    const pass = cb.beginRenderPass([{
        texture: swapchain.texture,
        clear_color: {r: 0.3, g: 0.4, b: 0.5, a: 1.0},
        load_op: GPULoadOp.Clear,
        store_op: GPUStoreOp.Store,
    }], null);
    pass.bindGraphicsPipeline(pipeline);
    pass.bindFragmentSamplers([{
        texture: computeTexture.raw,
        sampler: sampler.raw,
    }]);
    pass.bindVertexBuffers([{
        buffer: vertexBuffer.raw,
        offset: 0,
    }]);
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
