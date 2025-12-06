/* tslint:disable */
/* eslint-disable */

/**
 * Validates WGSL and returns true if valid, false otherwise.
 */
export function isWgslValid(wgsl: string): boolean;

/**
 * SPIR-V binary -> disassembled text for debugging.
 * Takes SPIR-V bytes (little-endian) and returns human-readable assembly.
 */
export function spirvBinToText(spirv_bytes: Uint8Array): string;

/**
 * Only validates WGSL (throws JS error if invalid).
 */
export function validateWgsl(wgsl: string): void;

/**
 * WGSL -> SPIR-V (binary words -> LE bytes) for Vulkan.
 */
export function wgslToSpirvBin(wgsl: string): Uint8Array;
