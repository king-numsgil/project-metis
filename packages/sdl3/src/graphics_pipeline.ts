import { defaultGraphicsPipelineCreateInfo, Device } from "./device.ts";
import { type GPUGraphicsPipelinePtr, type GPUShaderPtr, sdlReleaseGPUGraphicsPipeline } from "./ffi";

import {
    GPUBlendFactor,
    GPUBlendOp,
    GPUColorComponentFlags,
    type GPUColorTargetBlendState,
    type GPUColorTargetDescription,
    type GPUDepthStencilState,
    type GPUGraphicsPipelineCreateInfo,
    GPUPrimitiveType,
    type GPURasterizerState,
    GPUSampleCount,
    GPUTextureFormat,
    GPUVertexInputRate,
} from "./ffi/types";
import { type VertexBufferSource } from "./mesh.ts";
import type { Shader } from "./shader.ts";

export class GraphicsPipeline {
    public constructor(private readonly handle: GPUGraphicsPipelinePtr, private readonly device: Device) {
    }

    public get raw(): GPUGraphicsPipelinePtr {
        return this.handle;
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public dispose(): void {
        sdlReleaseGPUGraphicsPipeline(this.device.raw, this.handle);
    }
}

const DEFAULT_BLEND_STATE: GPUColorTargetBlendState = {
    enable_blend: false,
    color_blend_op: GPUBlendOp.Invalid,
    alpha_blend_op: GPUBlendOp.Invalid,
    src_color_blendfactor: GPUBlendFactor.Invalid,
    dst_color_blendfactor: GPUBlendFactor.Invalid,
    src_alpha_blendfactor: GPUBlendFactor.Invalid,
    dst_alpha_blendfactor: GPUBlendFactor.DstAlpha,
    color_write_mask: GPUColorComponentFlags.R | GPUColorComponentFlags.G | GPUColorComponentFlags.B | GPUColorComponentFlags.A,
    enable_color_write_mask: false,
};

export class GraphicsPipelineBuilder {
    private vertexShader: GPUShaderPtr | null = null;
    private fragmentShader: GPUShaderPtr | null = null;
    private colorTargets: GPUColorTargetDescription[] = [];
    private vertexSlots: Array<{ source: VertexBufferSource; slot: number }> = [];
    private primitive: GPUPrimitiveType = GPUPrimitiveType.TriangleList;
    private rasterizerOverride: Partial<GPURasterizerState> = {};
    private depthStencilOverride: Partial<GPUDepthStencilState> = {};
    private sampleCount: GPUSampleCount = GPUSampleCount.One;

    public constructor(private readonly device: Device) {
    }

    public shaders(vertex: Shader, fragment: Shader): this {
        this.vertexShader = vertex.raw;
        this.fragmentShader = fragment.raw;
        return this;
    }

    public addVertexInput(source: VertexBufferSource, slot: number = this.vertexSlots.length): this {
        if (this.vertexSlots.some(entry => entry.slot === slot)) {
            throw new Error(`GraphicsPipelineBuilder: vertex slot ${slot} is already bound`);
        }
        this.vertexSlots.push({source, slot});
        return this;
    }

    public addColorTarget(format: GPUTextureFormat, blend?: Partial<GPUColorTargetBlendState>): this {
        this.colorTargets.push({
            format,
            blend_state: blend
                ? {...DEFAULT_BLEND_STATE, ...blend}
                : DEFAULT_BLEND_STATE,
        });
        return this;
    }

    public clearColorTargets(): this {
        this.colorTargets = [];
        return this;
    }

    public primitiveType(type: GPUPrimitiveType): this {
        this.primitive = type;
        return this;
    }

    public rasterizer(partial: Partial<GPURasterizerState>): this {
        this.rasterizerOverride = {...this.rasterizerOverride, ...partial};
        return this;
    }

    public depthStencil(partial: Partial<GPUDepthStencilState>): this {
        this.depthStencilOverride = {...this.depthStencilOverride, ...partial};
        return this;
    }

    public multisample(count: GPUSampleCount): this {
        this.sampleCount = count;
        return this;
    }

    public build(): GraphicsPipeline {
        if (!this.vertexShader || !this.fragmentShader) {
            throw new Error("GraphicsPipelineBuilder: shaders() must be called before build()");
        }
        if (this.colorTargets.length === 0) {
            throw new Error("GraphicsPipelineBuilder: at least one color target is required");
        }

        // Sort slots ascending so the attribute location assignments are deterministic
        const sortedSlots = [...this.vertexSlots].sort((a, b) => a.slot - b.slot);

        const info: GPUGraphicsPipelineCreateInfo = {
            ...defaultGraphicsPipelineCreateInfo,
            vertex_shader: this.vertexShader,
            fragment_shader: this.fragmentShader,
            primitive_type: this.primitive,
            rasterizer_state: {
                ...defaultGraphicsPipelineCreateInfo.rasterizer_state,
                ...this.rasterizerOverride,
            },
            depth_stencil_state: {
                ...defaultGraphicsPipelineCreateInfo.depth_stencil_state,
                ...this.depthStencilOverride,
            },
            multisample_state: {
                ...defaultGraphicsPipelineCreateInfo.multisample_state,
                sample_count: this.sampleCount,
            },
            vertex_input_state: {
                num_vertex_buffers: sortedSlots.length,
                vertex_buffer_descriptions: sortedSlots.map(({source, slot}) => ({
                    slot,
                    pitch: source.vertices.type.arrayPitch,
                    input_rate: GPUVertexInputRate.Vertex,
                    instance_step_rate: 0,
                })),
                // getVertexAttributes(slot) already stamps the correct buffer_slot
                // on each attribute, so a flat concat is all we need
                vertex_attributes: sortedSlots.flatMap(({source, slot}) =>
                    source.getVertexAttributes(slot),
                ),
                num_vertex_attributes: sortedSlots.reduce(
                    (sum, {source, slot}) => sum + source.getVertexAttributes(slot).length,
                    0,
                ),
            },
            target_info: {
                ...defaultGraphicsPipelineCreateInfo.target_info,
                num_color_targets: this.colorTargets.length,
                color_target_descriptions: this.colorTargets,
            },
        };

        return this.device.createGraphicsPipeline(info);
    }
}
