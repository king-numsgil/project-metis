import { ArrayOf, F32, StructOf, Vec } from "metis-data";
import { Game } from "metis-engine";
import { RootWidget, LabelWidget } from "metis-engine/ui";
import {
    Device,
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
} from "sdl3";
import { sdlGetKeyboardState } from "sdl3/ffi";

import triangleShader from "./triangle.wgsl";

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

using game = new Game();
console.log(`Platform: ${game.system.platform}`);

console.log("Supported GPU drivers :", Device.listSupportedDrivers());

const dev = game.device;
console.log(`Device Driver : ${dev.driver}`);
console.log(`Device Shader Format : ${GPUShaderFormat[dev.shader_formats]}`);

game.mainWindow = game.createWindow("SDL Experiment", 1440, 768, GPUSampleCount.Four);
const wnd = game.window(game.mainWindow);

const keyboard = sdlGetKeyboardState();

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

using ui = new RootWidget(1440, 768);
ui.init(dev, wnd, GPUSampleCount.Four);
ui.add(new LabelWidget("Hello World!", 50, [25, 200]));

game.on("Quit", ({timestamp}) => {
    game.exit();
    console.log(`Got Quit event at ${timestamp}`);
});
game.on("KeyDown", ({timestamp, scancode, mod}) => {
    console.log(`Got KeyDown event at ${timestamp} with ${Scancode[scancode]} (${decodeKeymods(mod).join(" | ")})`);
});
game.on("PreFrame", (_) => {
    ui.tessellate(dev);
});
game.on("Frame", ({cb, texture, resolve_texture}) => {
    if (keyboard[Scancode.W] === 1) {
        console.log("Keyboard state for W is true!");
    }

    if (!texture || !resolve_texture) {
        console.log("Wrong frame event? Shouldn't happen...");
        return;
    }

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
        texture: texture.raw,
        resolve_texture: resolve_texture.raw,
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

    ui.render(cb, pass);
    pass.end();
});
game.run();
