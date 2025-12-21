import type { Vec2, Vec3, Vec4, Mat3, Mat4, Vec2d, Vec3d, Vec4d, Mat3d, Mat4d } from "wgpu-matrix";

/**
 * Supported attribute types for vertex data.
 * Single-precision types use Float32Array, double-precision types use Float64Array.
 * Matrix types follow std140/std430 alignment rules (mat3 packed as 3 vec4s).
 */
type AttributeType =
    | "f32"
    | "vec2"
    | "vec3"
    | "vec4"
    | "mat3"
    | "mat4"
    | "f64"
    | "vec2d"
    | "vec3d"
    | "vec4d"
    | "mat3d"
    | "mat4d";

/**
 * Describes a single vertex attribute with a name and type.
 */
interface AttributeDescriptor {
    name: string;
    type: AttributeType;
}

/**
 * Maps attribute types to their corresponding typed array types from wgpu-matrix.
 */
type AttributeTypeMap = {
    f32: Float32Array;
    vec2: Vec2;
    vec3: Vec3;
    vec4: Vec4;
    mat3: Mat3;
    mat4: Mat4;
    f64: Float64Array;
    vec2d: Vec2d;
    vec3d: Vec3d;
    vec4d: Vec4d;
    mat3d: Mat3d;
    mat4d: Mat4d;
};

/**
 * Constructs a type representing a complete vertex with all its attributes.
 * Each attribute name maps to its corresponding typed array type.
 */
type VertexData<T extends readonly AttributeDescriptor[]> = {
    [K in T[number]["name"]]: AttributeTypeMap[Extract<T[number], { name: K }>["type"]];
};

/**
 * A type-safe vertex buffer that manages GPU-compatible vertex data with automatic
 * memory layout and integration with wgpu-matrix.
 *
 * Features:
 * - Type-safe vertex attribute access with full TypeScript inference
 * - Zero-copy views into the underlying buffer for efficient manipulation
 * - Automatic std140/std430 alignment for matrices
 * - Direct ArrayBuffer access for efficient GPU uploads
 * - Support for both single and double precision attributes
 *
 * @template T - The vertex layout as a readonly array of attribute descriptors
 *
 * @example
 * ```typescript
 * const layout = [
 *     { name: "position", type: "vec3" },
 *     { name: "normal", type: "vec3" },
 *     { name: "color", type: "vec4" }
 * ] as const;
 *
 * const buffer = new VertexBuffer(layout, 1000);
 *
 * // Set vertex data
 * buffer.setVertex(0, {
 *     position: vec3.create(1, 2, 3),
 *     normal: vec3.create(0, 1, 0),
 *     color: vec4.create(1, 0, 0, 1)
 * });
 *
 * // Manipulate directly (zero-copy)
 * const pos = buffer.getVertexAttribute(0, "position");
 * vec3.scale(pos, 2, pos);
 *
 * // Upload to GPU
 * const gpuData = buffer.toArrayBuffer();
 * ```
 */

export class VertexBuffer<T extends readonly AttributeDescriptor[]> {
    /** The underlying ArrayBuffer storing all vertex data */
    private readonly buffer: ArrayBuffer;

    /** DataView for low-level buffer access */
    private view: DataView;

    /** The vertex attribute layout definition */
    private readonly layout: T;

    /** Total number of vertices in the buffer */
    private readonly vertexCount: number;

    /** Size of a single vertex in bytes */
    private readonly vertexSize: number;

    /** Byte offset for each attribute within a vertex */
    private attributeOffsets: Map<string, number>;

    /** Size in bytes for each attribute */
    private attributeSizes: Map<string, number>;

    /**
     * Creates a new vertex buffer with the specified layout and capacity.
     *
     * @param layout - Array of attribute descriptors defining the vertex structure
     * @param vertexCount - Number of vertices to allocate space for
     *
     * @example
     * ```typescript
     * const layout = [
     *     { name: "position", type: "vec3" },
     *     { name: "uv", type: "vec2" }
     * ] as const;
     * const buffer = new VertexBuffer(layout, 100);
     * ```
     */
    constructor(layout: T, vertexCount: number) {
        this.layout = layout;
        this.vertexCount = vertexCount;
        this.attributeOffsets = new Map();
        this.attributeSizes = new Map();

        // Calculate vertex size and offsets
        let offset = 0;
        for (const attr of layout) {
            const size = this.getAttributeSize(attr.type);
            this.attributeOffsets.set(attr.name, offset);
            this.attributeSizes.set(attr.name, size);
            offset += size;
        }
        this.vertexSize = offset;

        // Allocate buffer
        this.buffer = new ArrayBuffer(this.vertexSize * vertexCount);
        this.view = new DataView(this.buffer);
    }

    /**
     * Calculates the size in bytes for a given attribute type.
     * Respects std140/std430 alignment rules (e.g., mat3 is packed as 3 vec4s).
     */
    private getAttributeSize(type: AttributeType): number {
        const sizes: Record<AttributeType, number> = {
            f32: 4,
            vec2: 8,
            vec3: 12,
            vec4: 16,
            mat3: 48,
            mat4: 64,
            f64: 8,
            vec2d: 16,
            vec3d: 24,
            vec4d: 32,
            mat3d: 96,
            mat4d: 128,
        };
        return sizes[type];
    }

    /**
     * Returns the number of components (floats/doubles) for a given attribute type.
     * For mat3/mat3d, returns 12 (not 9) to account for std140/std430 padding.
     */
    private getComponentCount(type: AttributeType): number {
        const counts: Record<AttributeType, number> = {
            f32: 1,
            vec2: 2,
            vec3: 3,
            vec4: 4,
            mat3: 12,
            mat4: 16,
            f64: 1,
            vec2d: 2,
            vec3d: 3,
            vec4d: 4,
            mat3d: 12,
            mat4d: 16,
        };
        return counts[type];
    }

    /**
     * Checks if an attribute type uses double precision (Float64Array).
     */
    private isDoublePrecision(type: AttributeType): boolean {
        return type === "f64" || type === "vec2d" || type === "vec3d" || type === "vec4d" || type === "mat3d" || type === "mat4d";
    }

    /**
     * Get a typed array view for a specific vertex attribute.
     * This is a direct view into the buffer - modifications affect the underlying data.
     *
     * This is the most efficient way to manipulate vertex data as it avoids copies.
     * The returned typed array (Float32Array or Float64Array) can be used directly
     * with wgpu-matrix functions.
     *
     * @param vertexIndex - Index of the vertex (0-based)
     * @param attributeName - Name of the attribute to access
     * @returns A typed array view directly into the buffer
     *
     * @example
     * ```typescript
     * // Zero-copy manipulation
     * const pos = buffer.getVertexAttribute(0, "position");
     * vec3.scale(pos, 2, pos);  // Modifies buffer directly
     *
     * const normal = buffer.getVertexAttribute(5, "normal");
     * vec3.normalize(normal, normal);
     * ```
     */
    getVertexAttribute<K extends T[number]["name"]>(
        vertexIndex: number,
        attributeName: K
    ): AttributeTypeMap[Extract<T[number], { name: K }>["type"]] {
        if (vertexIndex < 0 || vertexIndex >= this.vertexCount) {
            throw new Error(`Vertex index ${vertexIndex} out of bounds`);
        }

        const offset = this.attributeOffsets.get(attributeName);
        if (offset === undefined) {
            throw new Error(`Attribute '${attributeName}' not found in layout`);
        }

        const attr = this.layout.find((a) => a.name === attributeName);
        if (!attr) {
            throw new Error(`Attribute '${attributeName}' not found in layout`);
        }

        const componentCount = this.getComponentCount(attr.type);
        const byteOffset = vertexIndex * this.vertexSize + offset;
        const isDouble = this.isDoublePrecision(attr.type);

        if (isDouble) {
            return new Float64Array(
                this.buffer,
                byteOffset,
                componentCount
            ) as AttributeTypeMap[Extract<T[number], { name: K }>["type"]];
        } else {
            return new Float32Array(
                this.buffer,
                byteOffset,
                componentCount
            ) as AttributeTypeMap[Extract<T[number], { name: K }>["type"]];
        }
    }

    /**
     * Set a complete vertex's data at once.
     *
     * You can provide a partial vertex object - only the specified attributes will be updated.
     * This method copies the data into the buffer.
     *
     * @param vertexIndex - Index of the vertex to set (0-based)
     * @param data - Partial or complete vertex data to set
     *
     * @example
     * ```typescript
     * // Set all attributes
     * buffer.setVertex(0, {
     *     position: vec3.create(1, 2, 3),
     *     normal: vec3.create(0, 1, 0),
     *     color: vec4.create(1, 0, 0, 1)
     * });
     *
     * // Update only position
     * buffer.setVertex(0, {
     *     position: vec3.create(5, 6, 7)
     * });
     * ```
     */
    setVertex(vertexIndex: number, data: Partial<VertexData<T>>): void {
        if (vertexIndex < 0 || vertexIndex >= this.vertexCount) {
            throw new Error(`Vertex index ${vertexIndex} out of bounds`);
        }

        for (const [name, value] of Object.entries(data)) {
            const offset = this.attributeOffsets.get(name);
            if (offset === undefined) continue;

            const attr = this.layout.find((a) => a.name === name);
            if (!attr) continue;

            const componentCount = this.getComponentCount(attr.type);
            const byteOffset = vertexIndex * this.vertexSize + offset;
            const isDouble = this.isDoublePrecision(attr.type);

            if (isDouble) {
                const target = new Float64Array(this.buffer, byteOffset, componentCount);
                if (value instanceof Float64Array) {
                    target.set(value);
                } else if (typeof value === "number") {
                    target[0] = value;
                }
            } else {
                const target = new Float32Array(this.buffer, byteOffset, componentCount);
                if (value instanceof Float32Array) {
                    target.set(value);
                } else if (typeof value === "number") {
                    target[0] = value;
                }
            }
        }
    }

    /**
     * Get all data for a specific vertex.
     *
     * Returns a complete copy of the vertex data. Unlike getVertexAttribute(),
     * modifying the returned data will not affect the buffer.
     *
     * @param vertexIndex - Index of the vertex to retrieve (0-based)
     * @returns A complete vertex object with all attributes
     *
     * @example
     * ```typescript
     * const vertex = buffer.getVertex(0);
     * console.log(vertex.position);  // Float32Array [x, y, z]
     * console.log(vertex.color);     // Float32Array [r, g, b, a]
     * ```
     */
    getVertex(vertexIndex: number): VertexData<T> {
        if (vertexIndex < 0 || vertexIndex >= this.vertexCount) {
            throw new Error(`Vertex index ${vertexIndex} out of bounds`);
        }

        const vertex = {} as VertexData<T>;

        for (const attr of this.layout) {
            const offset = this.attributeOffsets.get(attr.name);
            if (offset === undefined) continue;

            const componentCount = this.getComponentCount(attr.type);
            const byteOffset = vertexIndex * this.vertexSize + offset;
            const isDouble = this.isDoublePrecision(attr.type);

            // Create a copy of the data
            if (isDouble) {
                const source = new Float64Array(this.buffer, byteOffset, componentCount);
                (vertex as Record<string, Float64Array | Float32Array>)[attr.name] = new Float64Array(source);
            } else {
                const source = new Float32Array(this.buffer, byteOffset, componentCount);
                (vertex as Record<string, Float64Array | Float32Array>)[attr.name] = new Float32Array(source);
            }
        }

        return vertex;
    }

    /**
     * Get the total number of vertices in this buffer.
     */
    getVertexCount(): number {
        return this.vertexCount;
    }

    /**
     * Get the size of a single vertex in bytes.
     */
    getVertexSize(): number {
        return this.vertexSize;
    }

    /**
     * Get the total buffer size in bytes.
     */
    getBufferSize(): number {
        return this.buffer.byteLength;
    }

    /**
     * Get the underlying ArrayBuffer.
     *
     * This is the most efficient way to upload to GPU - it's a direct reference
     * to the backing buffer with no copying involved.
     *
     * @returns The raw ArrayBuffer containing all vertex data
     *
     * @example
     * ```typescript
     * const gpuData = buffer.toArrayBuffer();
     * // Upload to SDL3 GPU buffer using Koffi...
     * ```
     */
    toArrayBuffer(): ArrayBuffer {
        return this.buffer;
    }

    /**
     * Copy data to an existing ArrayBuffer.
     *
     * Useful when you need to write into a pre-allocated buffer or when
     * combining multiple vertex buffers into a single upload.
     *
     * @param target - The destination ArrayBuffer
     * @param targetOffset - Byte offset in the target buffer (default: 0)
     *
     * @example
     * ```typescript
     * const uploadBuffer = new ArrayBuffer(1024);
     * buffer.copyToArrayBuffer(uploadBuffer, 0);
     * ```
     */
    copyToArrayBuffer(target: ArrayBuffer, targetOffset: number = 0): void {
        if (targetOffset + this.buffer.byteLength > target.byteLength) {
            throw new Error("Target buffer is too small");
        }

        const targetView = new Uint8Array(target, targetOffset, this.buffer.byteLength);
        const sourceView = new Uint8Array(this.buffer);
        targetView.set(sourceView);
    }

    /**
     * Get a Float32Array view of the entire buffer.
     *
     * Useful for bulk operations or debugging. Note that this interprets
     * the entire buffer as Float32, which may not be appropriate if you
     * have double-precision attributes.
     *
     * @returns A Float32Array view of the entire buffer
     */
    asFloat32Array(): Float32Array {
        return new Float32Array(this.buffer);
    }

    /**
     * Clear all vertex data to zeros.
     *
     * This is a fast operation that resets the entire buffer.
     */
    clear(): void {
        const view = new Uint8Array(this.buffer);
        view.fill(0);
    }

    /**
     * Get the layout definition.
     */
    getLayout(): readonly AttributeDescriptor[] {
        return this.layout;
    }
}
