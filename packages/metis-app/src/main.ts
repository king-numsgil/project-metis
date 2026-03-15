import {
    Device,
    EventType,
    GPUBlendFactor,
    GPUBlendOp,
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
    Keymod,
    Mesh,
    Scancode,
    System,
    Window,
} from "sdl3";
import {ArrayOf, F32, StructOf, Vec} from "metis-data";
import {Font, GPUTextEngine, Text, TTF} from "ttf3";
import {sdlGetError} from "sdl3/ffi";

import {join} from "node:path";

import triangleShader from "./triangle.wgsl";
import textShader from "./text.wgsl";

function decodeKeymods(mod: Keymod): string[] {
    return (Object.keys(Keymod) as Array<keyof typeof Keymod>)
        .filter(key => isNaN(Number(key))) // strip reverse numeric mappings
        .filter(key => {
            const value = Keymod[key];
            return value !== 0 && (mod & value) === value;
        });
}

if (!triangleShader.vertex || !triangleShader.fragment || !triangleShader.compute) {
    throw new Error("Failed loading triangle shader");
}

if (!textShader.vertex || !textShader.fragment) {
    throw new Error("Failed loading text shader");
}

using sys = new System();
console.log(`Platform: ${sys.platform}`);

using ttf = new TTF();
console.log(`TTF: ${ttf.version} (FT ${ttf.freetypeVersion}; HB ${ttf.harfbuzzVersion})`);

using wnd = Window.create("SDL Experiment", 1440, 768);
console.log(`WindowID: ${wnd.windowID}`);

console.log("Supported GPU drivers :", Device.listSupportedDrivers());

using dev = new Device(GPUShaderFormat.SPIRV, true);
dev.claimWindow(wnd);
console.log(`Device Driver : ${dev.driver}`);
console.log(`Device Shader Format : ${GPUShaderFormat[dev.shader_formats]}`);

using vertexShader = dev.createShader(triangleShader.vertex);
using fragmentShader = dev.createShader(triangleShader.fragment);

const quadBuffer = new Mesh(ArrayOf(StructOf({
    position: Vec(F32, 2),
    uv: Vec(F32, 2),
}), 4), 6);
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
    min_lod: 0,
    max_lod: 0,
    max_anisotropy: 0,
    mip_lod_bias: 0,
});

using computePipeline = dev.createComputePipeline(triangleShader.compute);
using pipeline = dev.buildGraphicsPipeline()
    .shaders(vertexShader, fragmentShader)
    .addColorTarget(dev.getSwapchainFormat(wnd))
    .addVertexInput(quadBuffer, 0)
    .primitiveType(GPUPrimitiveType.TriangleList)
    .build();

// ---------- TTF text setup ----------
using font = Font.open(join("assets", "JetBrainsMono-Regular.ttf"), 24);
using textEngine = GPUTextEngine.create(dev.raw);
using textObj = Text.create(textEngine.raw, font, "Hello World of TTF!");
textObj.update();

const WIN_W = 1440;
const WIN_H = 768;
const TEXT_X = 10;
const TEXT_Y = 34;

const drawData = textEngine.getDrawData(textObj);
if (!drawData || drawData.length === 0) {
    throw new Error("No TTF draw data");
}

// Handle the first (typically only) draw sequence for a single-line text
const seq = drawData[0]!;
const textMesh = new Mesh(
    ArrayOf(StructOf({xy: Vec(F32, 2), uv: Vec(F32, 2)}), seq.num_vertices),
    seq.num_indices,
    "uint32",
);

// Convert pixel-space coordinates from SDL_ttf to NDC, applying the text offset
for (let i = 0; i < seq.num_vertices; i++) {
    const px = (seq.xy[i]!.x + TEXT_X) / WIN_W * 2.0 - 1.0;
    const py = 1.0 - (seq.xy[i]!.y + TEXT_Y) / WIN_H * 2.0;
    textMesh.vertices.at(i).set({
        xy: [px, py],
        uv: [seq.uv[i]!.x, seq.uv[i]!.y],
    });
}
textMesh.setIndices(seq.indices);

using textVertexBuf = textMesh.createVertexDeviceBuffer(dev);
using textIndexBuf = textMesh.createIndexDeviceBuffer(dev);

using textSampler = dev.createSampler({
    min_filter: GPUFilter.Linear,
    mag_filter: GPUFilter.Linear,
    mipmap_mode: GPUSamplerMipmapMode.Linear,
    address_mode_u: GPUSamplerAddressMode.ClampToEdge,
    address_mode_v: GPUSamplerAddressMode.ClampToEdge,
    address_mode_w: GPUSamplerAddressMode.ClampToEdge,
    compare_op: GPUCompareOp.Invalid,
    enable_anisotropy: false,
    enable_compare: false,
    min_lod: 0,
    max_lod: 0,
    max_anisotropy: 0,
    mip_lod_bias: 0,
});

using textVertexShader = dev.createShader(textShader.vertex);
using textFragmentShader = dev.createShader(textShader.fragment);

using textPipeline = dev.buildGraphicsPipeline()
    .shaders(textVertexShader, textFragmentShader)
    .addColorTarget(dev.getSwapchainFormat(wnd), {
        enable_blend: true,
        color_blend_op: GPUBlendOp.Add,
        alpha_blend_op: GPUBlendOp.Add,
        src_color_blendfactor: GPUBlendFactor.SrcAlpha,
        dst_color_blendfactor: GPUBlendFactor.OneMinusSrcAlpha,
        src_alpha_blendfactor: GPUBlendFactor.One,
        dst_alpha_blendfactor: GPUBlendFactor.DstAlpha,
    })
    .addVertexInput(textMesh, 0)
    .primitiveType(GPUPrimitiveType.TriangleList)
    .build();

// ---------- Render loop ----------
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

    // Compute pass: generate gradient texture
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

    pass.bindGraphicsPipeline(textPipeline);
    pass.bindFragmentSamplers([{
        texture: seq.atlas_texture,
        sampler: textSampler.raw,
    }]);
    pass.bindVertexBuffers([{
        buffer: textVertexBuf.raw,
        offset: 0,
    }]);
    pass.bindIndexBuffer({
        buffer: textIndexBuf.raw,
        offset: 0,
    }, GPUIndexElementSize.Size32Bit);
    pass.drawIndexedPrimitives(seq.num_indices);
    pass.end();

    if (!cb.submit()) {
        console.log(`Failed to submit command buffer : ${sdlGetError()}`);
    }
}

dev.releaseWindow(wnd);
