/* tslint:disable */
/* eslint-disable */

export class BindingInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toJSON(): any;
  readonly name: string;
  readonly group: number;
  readonly binding: number;
  readonly resource_type: string;
  readonly type_name: string | undefined;
}

export class EntryPointInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toJSON(): any;
  readonly name: string;
  readonly stage: string;
  readonly workgroup_size: Uint32Array | undefined;
  readonly bindings: BindingInfo[];
  readonly vertex_inputs: VertexInputInfo[];
  readonly fragment_outputs: FragmentOutputInfo[];
}

export class FragmentOutputInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toJSON(): any;
  readonly name: string;
  readonly location: number;
  readonly type_name: string;
}

export class ReflectionData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toJSON(): any;
  readonly entry_points: EntryPointInfo[];
  readonly types: TypeInfo[];
}

export class StructMemberInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toJSON(): any;
  readonly name: string;
  readonly type_name: string;
  readonly offset: number;
}

export class TypeInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toJSON(): any;
  readonly name: string;
  readonly kind: string;
  readonly members: StructMemberInfo[] | undefined;
}

export class VertexInputInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toJSON(): any;
  readonly name: string;
  readonly location: number;
  readonly type_name: string;
}

/**
 * Validates WGSL and returns true if valid, false otherwise.
 */
export function isWgslValid(wgsl: string): boolean;

/**
 * Reflects WGSL shader and returns detailed information about entry points,
 * bindings, inputs/outputs, and type definitions.
 */
export function reflectWgsl(wgsl: string): ReflectionData;

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
 * WGSL -> MSL (Metal Shading Language) source code for Metal/macOS/iOS.
 * If entry_point is provided, only compiles that specific entry point.
 * If entry_point is None or empty string, compiles all entry points.
 */
export function wgslToMsl(wgsl: string, entry_point?: string | null): string;

/**
 * WGSL -> SPIR-V (binary words -> LE bytes) for Vulkan.
 * If entry_point is provided, only compiles that specific entry point.
 * If entry_point is None or empty string, compiles all entry points.
 */
export function wgslToSpirvBin(wgsl: string, entry_point?: string | null): Uint8Array;
