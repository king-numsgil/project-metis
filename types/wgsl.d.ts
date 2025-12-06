// types/wgsl.d.ts
declare module "*.wgsl" {
    interface ShaderStage {
        spirv: Buffer;
        msl: Buffer;
    }

    interface CompiledShader {
        vertex: ShaderStage | null;
        fragment: ShaderStage | null;
        compute: ShaderStage | null;
    }

    const shader: CompiledShader;
    export default shader;
}