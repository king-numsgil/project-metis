import type { Tagged } from "type-fest";

import type { PropertiesID } from "./properties.ts";

export type GPUDevicePtr = Tagged<{}, "SDL_GPUDevice">;
export type GPUCommandBufferPtr = Tagged<{}, "SDL_GPUCommandBuffer">;
export type GPUTexturePtr = Tagged<{}, "SDL_GPUTexture">;
export type GPURenderPassPtr = Tagged<{}, "SDL_GPURenderPass">;
export type GPUBufferPtr = Tagged<{}, "SDL_GPUBuffer">;
export type GPUTransferBufferPtr = Tagged<{}, "SDL_GPUTransferBuffer">;
export type GPUFencePtr = Tagged<{}, "SDL_GPUFence">;
export type GPUCopyPassPtr = Tagged<{}, "SDL_GPUCopyPass">;
export type GPUShaderPtr = Tagged<{}, "SDL_GPUShader">;
export type GPUGraphicsPipelinePtr = Tagged<{}, "SDL_GPUGraphicsPipeline">;

export enum GPUShaderFormat {
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

export enum GPUBufferUsageFlags {
    Vertex = 1 << 0, // Vertex buffer
    Index = 1 << 1, // Index buffer
    Indirect = 1 << 2, // Indirect buffer
    GraphicsStorageRead = 1 << 3, // Storage read in graphics stages
    ComputeStorageRead = 1 << 4, // Storage read in compute stage
    ComputeStorageWrite = 1 << 5, // Storage write in compute stage
}

export enum GPUTransferBufferUsage {
    Upload,
    Download,
}

export enum GPUShaderStage {
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

export enum GPUIndexElementSize {
    Size16Bit,
    Size32Bit,
}

export enum GPUFillMode {
    Fill,
    Line,
}

export enum GPUCullMode {
    None,
    Front,
    Back,
}

export enum GPUFrontFace {
    CounterClockwise,
    Clockwise,
}

export enum GPUCompareOp {
    Invalid,
    Never,
    Less,
    Equal,
    LessOrEqual,
    Greater,
    NotEqual,
    GreaterOrEqual,
    Always,
}

export enum GPUStencilOp {
    Invalid,
    Keep,
    Zero,
    Replace,
    IncrementAndClamp,
    DecrementAndClamp,
    Invert,
    IncrementAndWrap,
    DecrementAndWrap,
}

export enum GPUBlendOp {
    Invalid,
    Add,
    Subtract,
    ReverseSubtract,
    Min,
    Max,
}

export enum GPUBlendFactor {
    Invalid,
    Zero,
    One,
    SrcColor,
    OneMinusSrcColor,
    DstColor,
    OneMinusDstColor,
    SrcAlpha,
    OneMinusSrcAlpha,
    DstAlpha,
    OneMinusDstAlpha,
    ConstantColor,
    OneMinusConstantColor,
    SrcAlphaSaturate,
}

export enum GPUColorComponentFlags {
    R = 1 << 0,
    G = 1 << 1,
    B = 1 << 2,
    A = 1 << 3,
}

export enum GPUFilter {
    Nearest,
    Linear,
}

export enum GPUSamplerMipmapMode {
    Nearest,
    Linear,
}

export enum GPUSamplerAddressMode {
    Repeat,
    MirroredRepeat,
    ClampToEdge,
}

export enum GPUSampleCount {
    One,
    Two,
    Four,
    Eight,
}

export enum GPUTextureFormat {
    Invalid,

    // Unsigned Normalized Float Color Formats
    A8Unorm,
    R8Unorm,
    R8G8Unorm,
    R8G8B8A8Unorm,
    R16Unorm,
    R16G16Unorm,
    R16G16B16A16Unorm,
    R10G10B10A2Unorm,
    B5G6R5Unorm,
    B5G5R5A1Unorm,
    B4G4R4A4Unorm,
    B8G8R8A8Unorm,

    // Compressed Unsigned Normalized Float Color Formats
    Bc1RgbaUnorm,
    Bc2RgbaUnorm,
    Bc3RgbaUnorm,
    Bc4RUnorm,
    Bc5RgUnorm,
    Bc7RgbaUnorm,

    // Compressed Signed Float Color Formats
    Bc6hRgbFloat,

    // Compressed Unsigned Float Color Formats
    Bc6hRgbUfloat,

    // Signed Normalized Float Color Formats
    R8Snorm,
    R8G8Snorm,
    R8G8B8A8Snorm,
    R16Snorm,
    R16G16Snorm,
    R16G16B16A16Snorm,

    // Signed Float Color Formats
    R16Float,
    R16G16Float,
    R16G16B16A16Float,
    R32Float,
    R32G32Float,
    R32G32B32A32Float,

    // Unsigned Float Color Formats
    R11G11B10Ufloat,

    // Unsigned Integer Color Formats
    R8Uint,
    R8G8Uint,
    R8G8B8A8Uint,
    R16Uint,
    R16G16Uint,
    R16G16B16A16Uint,
    R32Uint,
    R32G32Uint,
    R32G32B32A32Uint,

    // Signed Integer Color Formats
    R8Int,
    R8G8Int,
    R8G8B8A8Int,
    R16Int,
    R16G16Int,
    R16G16B16A16Int,
    R32Int,
    R32G32Int,
    R32G32B32A32Int,

    // SRGB Unsigned Normalized Color Formats
    R8G8B8A8UnormSrgb,
    B8G8R8A8UnormSrgb,

    // Compressed SRGB Unsigned Normalized Color Formats
    Bc1RgbaUnormSrgb,
    Bc2RgbaUnormSrgb,
    Bc3RgbaUnormSrgb,
    Bc7RgbaUnormSrgb,

    // Depth Formats
    D16Unorm,
    D24Unorm,
    D32Float,
    D24UnormS8Uint,
    D32FloatS8Uint,

    // Compressed ASTC Normalized Float Color Formats
    Astc4x4Unorm,
    Astc5x4Unorm,
    Astc5x5Unorm,
    Astc6x5Unorm,
    Astc6x6Unorm,
    Astc8x5Unorm,
    Astc8x6Unorm,
    Astc8x8Unorm,
    Astc10x5Unorm,
    Astc10x6Unorm,
    Astc10x8Unorm,
    Astc10x10Unorm,
    Astc12x10Unorm,
    Astc12x12Unorm,

    // Compressed SRGB ASTC Formats
    Astc4x4UnormSrgb,
    Astc5x4UnormSrgb,
    Astc5x5UnormSrgb,
    Astc6x5UnormSrgb,
    Astc6x6UnormSrgb,
    Astc8x5UnormSrgb,
    Astc8x6UnormSrgb,
    Astc8x8UnormSrgb,
    Astc10x5UnormSrgb,
    Astc10x6UnormSrgb,
    Astc10x8UnormSrgb,
    Astc10x10UnormSrgb,
    Astc12x10UnormSrgb,
    Astc12x12UnormSrgb,

    // Compressed ASTC Signed Float Formats
    Astc4x4Float,
    Astc5x4Float,
    Astc5x5Float,
    Astc6x5Float,
    Astc6x6Float,
    Astc8x5Float,
    Astc8x6Float,
    Astc8x8Float,
    Astc10x5Float,
    Astc10x6Float,
    Astc10x8Float,
    Astc10x10Float,
    Astc12x10Float,
    Astc12x12Float,
}

export enum GPUPrimitiveType {
    TriangleList,
    TriangleStrip,
    LineList,
    LineStrip,
    PointList,
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

export interface GPUBufferCreateInfo {
    usage: GPUBufferUsageFlags;
    size: number;
    props?: PropertiesID;
}

export interface GPUTransferBufferCreateInfo {
    usage: GPUTransferBufferUsage;
    size: number;
    props?: PropertiesID;
}

export interface GPUBufferLocation {
    buffer: GPUBufferPtr,
    offset: number;
}

export interface GPUTransferBufferLocation {
    transfer_buffer: GPUTransferBufferPtr,
    offset: number;
}

export interface GPUBufferRegion {
    buffer: GPUBufferPtr;
    offset: number;
    size: number;
}

export interface GPUViewport {
    x: number;
    y: number;
    w: number;
    h: number;
    min_depth: number;
    max_depth: number;
}

export interface GPUVertexBufferDescription {
    slot: number;
    pitch: number;
    input_rate: GPUVertexInputRate;
    instance_step_rate: number;
}

export interface GPUVertexAttribute {
    location: number;
    buffer_slot: number;
    format: GPUVertexElementFormat,
    offset: number;
}

export interface GPUVertexInputState {
    vertex_buffer_descriptions: GPUVertexBufferDescription[];
    num_vertex_buffers: number;
    vertex_attributes: GPUVertexAttribute[];
    num_vertex_attributes: number;
}

export interface GPUStencilOpState {
    fail_op: GPUStencilOp;
    pass_op: GPUStencilOp;
    depth_fail_op: GPUStencilOp;
    compare_op: GPUCompareOp;
}

export interface GPUColorTargetBlendState {
    src_color_blendfactor: GPUBlendFactor;
    dst_color_blendfactor: GPUBlendFactor;
    color_blend_op: GPUBlendOp;
    src_alpha_blendfactor: GPUBlendFactor;
    dst_alpha_blendfactor: GPUBlendFactor;
    alpha_blend_op: GPUBlendOp;
    color_write_mask: GPUColorComponentFlags;
    enable_blend: boolean;
    enable_color_write_mask: boolean;
}

export interface GPUShaderCreateInfo {
    code_size: number;
    code: Buffer;
    entrypoint: string;
    format: GPUShaderFormat;
    stage: GPUShaderStage;
    num_samplers: number;
    num_storage_textures: number;
    num_storage_buffers: number;
    num_uniform_buffers: number;
    props?: PropertiesID;
}

export interface GPURasterizerState {
    fill_mode: GPUFillMode;
    cull_mode: GPUCullMode;
    front_face: GPUFrontFace;
    depth_bias_constant_factor: number;
    depth_bias_clamp: number;
    depth_bias_slope_factor: number;
    enable_depth_bias: boolean;
    enable_depth_clip: boolean;
}

export interface GPUMultisampleState {
    sample_count: GPUSampleCount;
    sample_mask: number;
    enable_mask: boolean;
}

export interface GPUDepthStencilState {
    compare_op: GPUCompareOp;
    back_stencil_state: GPUStencilOpState;
    front_stencil_state: GPUStencilOpState;
    compare_mask: number;
    write_mask: number;
    enable_depth_test: boolean;
    enable_depth_write: boolean;
    enable_stencil_test: boolean;
}

export interface GPUColorTargetDescription {
    format: GPUTextureFormat;
    blend_state: GPUColorTargetBlendState;
}

export interface GPUGraphicsPipelineTargetInfo {
    color_target_descriptions: GPUColorTargetDescription[];
    num_color_targets: number;
    depth_stencil_format: GPUTextureFormat;
    has_depth_stencil_target: boolean;
}

export interface GPUGraphicsPipelineCreateInfo {
    vertex_shader: GPUShaderPtr;
    fragment_shader: GPUShaderPtr;
    vertex_input_state: GPUVertexInputState;
    primitive_type: GPUPrimitiveType;
    rasterizer_state: GPURasterizerState;
    multisample_state: GPUMultisampleState;
    depth_stencil_state: GPUDepthStencilState;
    target_info: GPUGraphicsPipelineTargetInfo;
    props?: PropertiesID;
}

export interface GPUBufferBinding {
    buffer: GPUBufferPtr,
    offset: number;
}
