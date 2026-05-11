import { ArrayOf, F32, type F32Descriptor, Mat4, type MatMemoryBuffer, StructOf, Vec } from "metis-data";
import { type FlushOutput, VectorContext } from "metis-vector";
import { join } from "node:path";
import {
    CommandBuffer,
    Device,
    DeviceBuffer,
    GPUBlendFactor,
    GPUBlendOp,
    GPUColorComponentFlags,
    GPUIndexElementSize,
    GPUPrimitiveType,
    GPUSampleCount,
    GraphicsPipeline,
    Mesh,
    RenderPass,
    Shader,
    Window,
} from "sdl3";
import type { IWidget } from "./interfaces.ts";
import shader from "./vector.wgsl";
import type { WidgetID } from "./widget_id.ts";

if (!shader.vertex || !shader.fragment) {
    throw new Error("Failed loading UI shader");
}

export class RootWidget {
    private readonly ctx: VectorContext;

    private readonly proj: MatMemoryBuffer<F32Descriptor, 4>;

    private vertexShader: Shader | null = null;
    private fragmentShader: Shader | null = null;
    private vertexBuffer: DeviceBuffer | null = null;
    private indexBuffer: DeviceBuffer | null = null;
    private pipeline: GraphicsPipeline | null = null;

    private flush: FlushOutput | null = null;
    private mesh = new Mesh(
        ArrayOf(
            StructOf({
                position: Vec(F32, 2),
                uv: Vec(F32, 2),
            }),
            16384,
        ),
        32768,
        "uint32",
    );

    private readonly _owned: Map<WidgetID, IWidget> = new Map();
    private readonly _children: Array<IWidget> = new Array<IWidget>();

    public constructor(width: number, height: number, tolerance: number = 0.25) {
        this.ctx = new VectorContext(tolerance);
        this.ctx.loadFont("JetBrainsMono", join("assets", "JetBrainsMono-Regular.ttf"));
        this.ctx.loadFont("InterItalic", join("assets", "InterVariable-Italic.ttf"));
        this.ctx.loadFont("Inter", join("assets", "InterVariable.ttf"));

        this.proj = Mat4.orthographic(F32, 0, width, 0, height, -1, 1);
    }

    public get children(): Array<IWidget> {
        return this._children;
    }

    public get isDirty(): boolean {
        return this._children.some(child => child.isDirty);
    }

    public dispose(): void {
        if (this.vertexShader) {
            this.vertexShader.dispose();
            this.vertexShader = null;
        }
        if (this.fragmentShader) {
            this.fragmentShader.dispose();
            this.fragmentShader = null;
        }

        if (this.vertexBuffer) {
            this.vertexBuffer.dispose();
            this.vertexBuffer = null;
        }
        if (this.indexBuffer) {
            this.indexBuffer.dispose();
            this.indexBuffer = null;
        }

        if (this.pipeline) {
            this.pipeline.dispose();
            this.pipeline = null;
        }
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public init(dev: Device, wnd: Window, sample_count: GPUSampleCount): void {
        if (!this.vertexShader && shader.vertex) {
            this.vertexShader = dev.createShader(shader.vertex);
        }
        if (!this.fragmentShader && shader.fragment) {
            this.fragmentShader = dev.createShader(shader.fragment);
        }

        if (!this.vertexBuffer) {
            this.vertexBuffer = this.mesh.createVertexDeviceBuffer(dev);
        }
        if (!this.indexBuffer) {
            this.indexBuffer = this.mesh.createIndexDeviceBuffer(dev);
        }

        if (this.pipeline) {
            this.pipeline.dispose();
            this.pipeline = null;
        }
        if (!this.pipeline && this.vertexShader && this.fragmentShader) {
            this.pipeline = dev.buildGraphicsPipeline()
                .shaders(this.vertexShader, this.fragmentShader)
                .addColorTarget(dev.getSwapchainFormat(wnd), {
                    enable_blend: true,
                    color_blend_op: GPUBlendOp.Add,
                    alpha_blend_op: GPUBlendOp.Add,
                    src_color_blendfactor: GPUBlendFactor.SrcAlpha,
                    dst_color_blendfactor: GPUBlendFactor.OneMinusSrcAlpha,
                    src_alpha_blendfactor: GPUBlendFactor.One,
                    dst_alpha_blendfactor: GPUBlendFactor.OneMinusSrcAlpha,
                    color_write_mask: GPUColorComponentFlags.R | GPUColorComponentFlags.G | GPUColorComponentFlags.B | GPUColorComponentFlags.A,
                    enable_color_write_mask: false,
                })
                .addVertexInput(this.mesh, 0)
                .primitiveType(GPUPrimitiveType.TriangleList)
                .multisample(sample_count)
                .build();
        }
    }

    public own(widget: IWidget): this {
        if (widget.owner && widget.owner !== this) {
            widget.owner.disown(widget);
        }

        widget.owner = this;
        this._owned.set(widget.id, widget);
        return this;
    }

    public disown(widget: IWidget): this {
        if (widget.owner && widget.owner === this) {
            widget.owner = null;
            this._owned.delete(widget.id);
        }

        return this;
    }

    public add(widget: IWidget): this {
        this.own(widget);
        this._children.push(widget);
        return this;
    }

    public tessellate(dev: Device): void {
        if (!this.vertexShader || !this.fragmentShader || !this.vertexBuffer || !this.indexBuffer || !this.pipeline) {
            throw new Error("RootWidget is not initialized");
        }

        if (this.isDirty) {
            this._children.forEach((child: IWidget) => {
                child.render(this.ctx);
            });

            this.flush = this.ctx.flush();
            new Float32Array(this.mesh.vertexBuffer).set(this.flush.vertices);
            this.mesh.setIndices(Array.from(this.flush.indices));

            this.mesh.updateVertexDeviceBuffer(dev, this.vertexBuffer);
            this.mesh.updateIndexDeviceBuffer(dev, this.indexBuffer);
        }
    }

    public render(cb: CommandBuffer, pass: RenderPass): void {
        if (!this.vertexShader || !this.fragmentShader || !this.vertexBuffer || !this.indexBuffer || !this.pipeline) {
            throw new Error("RootWidget is not initialized");
        }

        if (!this.flush) {
            throw new Error("RootWidget is not tessellated");
        }

        pass.bindGraphicsPipeline(this.pipeline);
        cb.pushVertexUniformData(0, this.proj.buffer);
        pass.bindVertexBuffers([{
            buffer: this.vertexBuffer.raw,
            offset: 0,
        }]);
        pass.bindIndexBuffer({
            buffer: this.indexBuffer.raw,
            offset: 0,
        }, GPUIndexElementSize.Size32Bit);

        for (const call of this.flush.drawCalls) {
            if (!this._owned.has(call.id as WidgetID)) {
                continue;
            }

            const widget = this._owned.get(call.id as WidgetID)!;
            cb.pushVertexUniformData(1, widget.modelMatrix.buffer);
            cb.pushFragmentUniformData(0, widget.paint.buffer);
            pass.drawIndexedPrimitives(call.indexCount, 1, call.firstIndex, 0);
        }
    }
}
