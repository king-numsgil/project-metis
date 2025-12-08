import type { Tagged } from "type-fest";

export type GPUDevicePtr = Tagged<{}, "SDL_GPUDevice">;
export type GPUCommandBufferPtr = Tagged<{}, "SDL_GPUCommandBuffer">;
export type GPUTexturePtr = Tagged<{}, "SDL_GPUTexture">;
export type GPURenderPassPtr = Tagged<{}, "SDL_GPURenderPass">;

export enum ShaderFormat {
    Invalid = 0,
    SPIRV = 1 << 1,
    DXBC = 1 << 2,
    DXIL = 1 << 3,
    MSL = 1 << 4,
    MetalLib = 1 << 5,
}

export enum GPUVertexElementFormat {
    INVALID,

    // 32-bit Signed Integers
    INT,
    INT2,
    INT3,
    INT4,

    // 32-bit Unsigned Integers
    UINT,
    UINT2,
    UINT3,
    UINT4,

    // 32-bit Floats
    FLOAT,
    FLOAT2,
    FLOAT3,
    FLOAT4,

    // 8-bit Signed Integers
    BYTE2,
    BYTE4,

    // 8-bit Unsigned Integers
    UBYTE2,
    UBYTE4,

    // 8-bit Signed Normalized
    BYTE2_NORM,
    BYTE4_NORM,

    // 8-bit Unsigned Normalized
    UBYTE2_NORM,
    UBYTE4_NORM,

    // 16-bit Signed Integers
    SHORT2,
    SHORT4,

    // 16-bit Unsigned Integers
    USHORT2,
    USHORT4,

    // 16-bit Signed Normalized
    SHORT2_NORM,
    SHORT4_NORM,

    // 16-bit Unsigned Normalized
    USHORT2_NORM,
    USHORT4_NORM,

    // 16-bit Floats
    HALF2,
    HALF4,
}

export enum GPUVertexInputRate {
    Vertex,    // Attribute indexing uses the vertex index
    Instance,   // Attribute indexing uses the instance index
}

export enum GpuBufferUsageFlags {
    Vertex                = 1 << 0, // Vertex buffer
    Index                 = 1 << 1, // Index buffer
    Indirect              = 1 << 2, // Indirect buffer
    GraphicsStorageRead   = 1 << 3, // Storage read in graphics stages
    ComputeStorageRead    = 1 << 4, // Storage read in compute stage
    ComputeStorageWrite   = 1 << 5, // Storage write in compute stage
}

export enum GpuTransferBufferUsage {
    Upload,
    Download,
}

export enum GpuShaderStage {
    Vertex,
    Fragment,
}

export enum GPULoadOp {
    Load,
    Clear,
    DontCare,
}

export enum GPUStoreOp {
    Store,
    DontCare,
    Resolve,
    ResolveAndStore,
}

export interface FColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface GPUColorTargetInfo {
    texture: GPUTexturePtr | null;
    mip_level?: number;
    layer_or_depth_plane?: number;
    clear_color?: FColor;
    load_op?: GPULoadOp;
    store_op?: GPUStoreOp;
    resolve_texture?: GPUTexturePtr | null;
    resolve_mip_level?: number;
    resolve_layer?: number;
    cycle?: boolean;
    cycle_resolve_texture?: boolean;
}

export interface GPUDepthStencilTargetInfo {
    texture: GPUTexturePtr | null;
    clear_depth?: number;
    load_op?: GPULoadOp;
    store_op?: GPUStoreOp;
    stencil_load_op?: GPULoadOp;
    stencil_store_op?: GPUStoreOp;
    cycle?: boolean;
    clear_stencil?: number;
}
