// types/wgsl.d.ts

declare module "*.wgsl" {
    enum GPUShaderFormat {
        Invalid = 0,
        SPIRV = 1 << 1,
        DXBC = 1 << 2,
        DXIL = 1 << 3,
        MSL = 1 << 4,
        MetalLib = 1 << 5,
    }

    enum GPUShaderStage {
        Vertex,
        Fragment,
    }

    interface GPUShaderCreateInfo {
        code_size: number;
        code: Buffer;
        entrypoint: string;
        format: GPUShaderFormat;
        stage: GPUShaderStage;
        num_samplers?: number;
        num_storage_textures?: number;
        num_storage_buffers?: number;
        num_uniform_buffers?: number;
    }

    interface GPUComputePipelineCreateInfo {
        code_size: number;
        code: Buffer;
        entrypoint: string;
        format: GPUShaderFormat;
        num_samplers?: number,
        num_readonly_storage_textures?: number,
        num_readonly_storage_buffers?: number,
        num_readwrite_storage_textures?: number,
        num_readwrite_storage_buffers?: number,
        num_uniform_buffers?: number,
        threadcount_x?: number,
        threadcount_y?: number,
        threadcount_z?: number,
    }

    interface CompiledShader {
        vertex: GPUShaderCreateInfo | null;
        fragment: GPUShaderCreateInfo | null;
        compute: GPUComputePipelineCreateInfo | null;
    }

    const shader: CompiledShader;
    export default shader;
}
