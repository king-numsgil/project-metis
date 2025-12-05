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
