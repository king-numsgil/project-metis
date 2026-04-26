import { ArrayOf, F32, Mat4, StructOf, Vec } from "metis-data";
import { VectorContext } from "metis-vector";
import { join } from "node:path";
import {
    Device,
    EventType,
    FlipMode,
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
import { sdlGetError, sdlGetKeyboardState } from "sdl3/ffi";

import triangleShader from "./triangle.wgsl";
import vectorShader from "./vector.wgsl";

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

if (!vectorShader.vertex || !vectorShader.fragment) {
    throw new Error("Failed loading vector shader");
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

const keyboard = sdlGetKeyboardState();

using msaaTexture = dev.createTexture({
    type: GPUTextureType.TwoD,
    format: dev.getSwapchainFormat(wnd),
    width: 1440, height: 768,
    layer_count_or_depth: 1, num_levels: 1,
    sample_count: GPUSampleCount.Four,
    usage: GPUTextureUsageFlags.ColorTarget,
});

using resolveTexture = dev.createTexture({
    type: GPUTextureType.TwoD,
    format: dev.getSwapchainFormat(wnd),
    width: 1440, height: 768,
    layer_count_or_depth: 1, num_levels: 1,
    sample_count: GPUSampleCount.One,
    usage: GPUTextureUsageFlags.ColorTarget | GPUTextureUsageFlags.Sampler,
});

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
    .multisample(GPUSampleCount.Four)
    .build();

const ctx = new VectorContext();
ctx.loadFont("JetBrainsMono", join("assets", "JetBrainsMono-Regular.ttf"));

ctx.beginPath();
ctx.arc(75, 75, 50, 0, 2 * Math.PI);
ctx.closePath();
ctx.fill(0.0, 0.0, 1.0, 1.0);
ctx.stroke(1.0, 1.0, 1.0, 1.0, 2.5);

ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(50, 0);
ctx.lineTo(50, 50);
ctx.lineTo(0, 50);
ctx.closePath();
ctx.fill(1.0, 0.0, 0.0, 1.0);

ctx.drawText("Hello World!", "JetBrainsMono", 50, 25, 200);
ctx.fill(1.0, 1.0, 1.0, 1.0);
ctx.stroke(0.0, 0.0, 0.0, 1.0, 1.5);
const gpuVector = ctx.flush();

console.log(`Number of draw calls for vector graphics : ${gpuVector.drawCalls.length}`);
const vectorMesh = new Mesh(ArrayOf(StructOf({
    position: Vec(F32, 2),
    color: Vec(F32, 4),
}), gpuVector.vertices.length / 6), gpuVector.indices.length);

new Float32Array(vectorMesh.vertexBuffer).set(gpuVector.vertices);
vectorMesh.setIndices(Array.from(gpuVector.indices));

using vectorVertexBuffer = vectorMesh.createVertexDeviceBuffer(dev);
using vectorIndexBuffer = vectorMesh.createIndexDeviceBuffer(dev);

using vectorVertexShader = dev.createShader(vectorShader.vertex);
using vectorFragmentShader = dev.createShader(vectorShader.fragment);

using vectorPipeline = dev.buildGraphicsPipeline()
    .shaders(vectorVertexShader, vectorFragmentShader)
    .addColorTarget(dev.getSwapchainFormat(wnd))
    .addVertexInput(vectorMesh, 0)
    .primitiveType(GPUPrimitiveType.TriangleList)
    .multisample(GPUSampleCount.Four)
    .build();

const ortho = Mat4.orthographic(F32, 0, 1440, 0, 768, -1, 1);

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

    if (keyboard[Scancode.W] === 1) {
        console.log("Keyboard state for W is true!");
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

    cb.pushVertexUniformData(0, ortho.buffer);

    const pass = cb.beginRenderPass([{
        texture: msaaTexture.raw,
        resolve_texture: resolveTexture.raw,
        clear_color: {r: 0.3, g: 0.4, b: 0.5, a: 1.0},
        load_op: GPULoadOp.Clear,
        store_op: GPUStoreOp.Resolve,
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

    pass.bindGraphicsPipeline(vectorPipeline);
    pass.bindVertexBuffers([{
        buffer: vectorVertexBuffer.raw,
        offset: 0,
    }]);
    pass.bindIndexBuffer({
        buffer: vectorIndexBuffer.raw,
        offset: 0,
    }, GPUIndexElementSize.Size16Bit);

    for (const call of gpuVector.drawCalls) {
        cb.pushVertexUniformData(1, call.modelMatrix.buffer as ArrayBuffer);
        pass.drawIndexedPrimitives(call.indexCount, 1, call.firstIndex, 0);
    }
    pass.end();

    cb.blitTexture({
        source: {
            texture: resolveTexture.raw,
            mip_level: 0,
            layer_or_depth_plane: 0,
            x: 0,
            y: 0,
            w: 1440,
            h: 768,
        },
        destination: {
            texture: swapchain.texture,
            mip_level: 0,
            layer_or_depth_plane: 0,
            x: 0,
            y: 0,
            w: swapchain.width,
            h: swapchain.height,
        },
        load_op: GPULoadOp.DontCare,
        filter: GPUFilter.Linear,
        clear_color: {
            r: 0,
            g: 0,
            b: 0,
            a: 0,
        },
        flip_mode: FlipMode.None,
        cycle: false,
    });

    if (!cb.submit()) {
        console.log(`Failed to submit command buffer : ${sdlGetError()}`);
    }
}

dev.releaseWindow(wnd);
