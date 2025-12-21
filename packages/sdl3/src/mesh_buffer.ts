import type { Mat3, Mat3d, Mat4, Mat4d, Vec2, Vec2d, Vec3, Vec3d, Vec4, Vec4d } from "wgpu-matrix";
import { type GPUVertexAttribute, GPUVertexElementFormat } from "sdl3";

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
 * Supported index element sizes for index buffers.
 */
type IndexType = "uint16" | "uint32";

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
 * A type-safe mesh buffer that manages GPU-compatible vertex and index data with automatic
 * memory layout and integration with wgpu-matrix and SDL3.
 *
 * Features:
 * - Type-safe vertex attribute access with full TypeScript inference
 * - Integrated index buffer management (uint16 or uint32)
 * - Zero-copy views into the underlying buffers for efficient manipulation
 * - Automatic std140/std430 alignment for matrices
 * - Direct ArrayBuffer access for efficient GPU uploads
 * - Support for both single and double precision attributes
 * - Automatic generation of SDL3 vertex attribute descriptors
 *
 * @template T - The vertex layout as a readonly array of attribute descriptors
 *
 * @example
 * ```typescript
 * const mesh = new MeshBuffer([
 *     { name: "position", type: "vec3" },
 *     { name: "normal", type: "vec3" },
 *     { name: "color", type: "vec4" }
 * ] as const, 1000, 3000);
 *
 * // Set vertex data
 * mesh.setVertex(0, {
 *     position: vec3.create(1, 2, 3),
 *     normal: vec3.create(0, 1, 0),
 *     color: vec4.create(1, 0, 0, 1)
 * });
 *
 * // Set indices
 * mesh.setIndices([0, 1, 2, 0, 2, 3]);
 *
 * // Generate SDL3 vertex attributes
 * const attributes = mesh.getVertexAttributes();
 *
 * // Upload to GPU
 * const vertexData = mesh.getVertexBuffer();
 * const indexData = mesh.getIndexBuffer();
 * ```
 */
export class MeshBuffer<T extends readonly AttributeDescriptor[]> {
    /** The underlying ArrayBuffer storing all vertex data */
    private readonly vertexBuffer: ArrayBuffer;

    /** DataView for low-level vertex buffer access */
    private vertexView: DataView;

    /** The underlying ArrayBuffer storing all index data */
    private readonly indexBuffer: ArrayBuffer;

    /** The vertex attribute layout definition */
    private readonly layout: T;

    /** Total number of vertices in the buffer */
    private readonly vertexCount: number;

    /** Total number of indices in the buffer */
    private readonly indexCount: number;

    /** Size of a single vertex in bytes */
    private readonly vertexSize: number;

    /** Byte offset for each attribute within a vertex */
    private attributeOffsets: Map<string, number>;

    /** Size in bytes for each attribute */
    private attributeSizes: Map<string, number>;

    /** The index element type (uint16 or uint32) */
    private readonly indexType: IndexType;

    /**
     * Creates a new mesh buffer with the specified layout and capacity.
     *
     * @param layout - Array of attribute descriptors defining the vertex structure
     * @param vertexCount - Number of vertices to allocate space for
     * @param indexCount - Number of indices to allocate space for (default: 0)
     * @param indexType - Index element size: "uint16" or "uint32" (default: "uint16")
     *
     * @example
     * ```typescript
     * const layout = [
     *     { name: "position", type: "vec3" },
     *     { name: "uv", type: "vec2" }
     * ] as const;
     * const mesh = new MeshBuffer(layout, 100, 300, "uint16");
     * ```
     */
    constructor(layout: T, vertexCount: number, indexCount: number = 0, indexType: IndexType = "uint16") {
        this.layout = layout;
        this.vertexCount = vertexCount;
        this.indexCount = indexCount;
        this.indexType = indexType;
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

        // Allocate vertex buffer
        this.vertexBuffer = new ArrayBuffer(this.vertexSize * vertexCount);
        this.vertexView = new DataView(this.vertexBuffer);

        // Allocate index buffer
        const indexElementSize = indexType === "uint16" ? 2 : 4;
        this.indexBuffer = new ArrayBuffer(indexElementSize * indexCount);
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
     * const pos = mesh.getVertexAttribute(0, "position");
     * vec3.scale(pos, 2, pos);  // Modifies buffer directly
     *
     * const normal = mesh.getVertexAttribute(5, "normal");
     * vec3.normalize(normal, normal);
     * ```
     */
    getVertexAttribute<K extends T[number]["name"]>(
        vertexIndex: number,
        attributeName: K,
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
                this.vertexBuffer,
                byteOffset,
                componentCount,
            ) as AttributeTypeMap[Extract<T[number], { name: K }>["type"]];
        } else {
            return new Float32Array(
                this.vertexBuffer,
                byteOffset,
                componentCount,
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
     * mesh.setVertex(0, {
     *     position: vec3.create(1, 2, 3),
     *     normal: vec3.create(0, 1, 0),
     *     color: vec4.create(1, 0, 0, 1)
     * });
     *
     * // Update only position
     * mesh.setVertex(0, {
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
            if (offset === undefined) {
                continue;
            }

            const attr = this.layout.find((a) => a.name === name);
            if (!attr) {
                continue;
            }

            const componentCount = this.getComponentCount(attr.type);
            const byteOffset = vertexIndex * this.vertexSize + offset;
            const isDouble = this.isDoublePrecision(attr.type);

            if (isDouble) {
                const target = new Float64Array(this.vertexBuffer, byteOffset, componentCount);
                if (value instanceof Float64Array) {
                    target.set(value);
                } else if (typeof value === "number") {
                    target[0] = value;
                }
            } else {
                const target = new Float32Array(this.vertexBuffer, byteOffset, componentCount);
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
     * const vertex = mesh.getVertex(0);
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
            if (offset === undefined) {
                continue;
            }

            const componentCount = this.getComponentCount(attr.type);
            const byteOffset = vertexIndex * this.vertexSize + offset;
            const isDouble = this.isDoublePrecision(attr.type);

            // Create a copy of the data
            if (isDouble) {
                const source = new Float64Array(this.vertexBuffer, byteOffset, componentCount);
                (vertex as Record<string, Float64Array | Float32Array>)[attr.name] = new Float64Array(source);
            } else {
                const source = new Float32Array(this.vertexBuffer, byteOffset, componentCount);
                (vertex as Record<string, Float64Array | Float32Array>)[attr.name] = new Float32Array(source);
            }
        }

        return vertex;
    }

    /**
     * Set all indices at once from an array.
     *
     * @param indices - Array of indices to set
     *
     * @example
     * ```typescript
     * mesh.setIndices([0, 1, 2, 0, 2, 3]);
     * ```
     */
    setIndices(indices: number[]): void {
        if (indices.length > this.indexCount) {
            throw new Error(`Index array length ${indices.length} exceeds buffer capacity ${this.indexCount}`);
        }

        if (this.indexType === "uint16") {
            const view = new Uint16Array(this.indexBuffer);
            view.set(indices);
        } else {
            const view = new Uint32Array(this.indexBuffer);
            view.set(indices);
        }
    }

    /**
     * Set a single index value.
     *
     * @param index - The index position to set (0-based)
     * @param value - The vertex index value
     *
     * @example
     * ```typescript
     * mesh.setIndex(0, 5);  // First index points to vertex 5
     * ```
     */
    setIndex(index: number, value: number): void {
        if (index < 0 || index >= this.indexCount) {
            throw new Error(`Index ${index} out of bounds`);
        }

        if (this.indexType === "uint16") {
            const view = new Uint16Array(this.indexBuffer);
            view[index] = value;
        } else {
            const view = new Uint32Array(this.indexBuffer);
            view[index] = value;
        }
    }

    /**
     * Get a single index value.
     *
     * @param index - The index position to retrieve (0-based)
     * @returns The vertex index value
     */
    getIndex(index: number): number {
        if (index < 0 || index >= this.indexCount) {
            throw new Error(`Index ${index} out of bounds`);
        }

        if (this.indexType === "uint16") {
            const view = new Uint16Array(this.indexBuffer);
            return view[index]!;
        } else {
            const view = new Uint32Array(this.indexBuffer);
            return view[index]!;
        }
    }

    /**
     * Get a typed array view of all indices.
     * This is a direct view - modifications affect the underlying buffer.
     *
     * @returns Uint16Array or Uint32Array view of the index buffer
     */
    getIndices(): Uint16Array | Uint32Array {
        if (this.indexType === "uint16") {
            return new Uint16Array(this.indexBuffer);
        } else {
            return new Uint32Array(this.indexBuffer);
        }
    }

    /**
     * Generate SDL3 vertex attribute descriptors for this mesh's layout.
     *
     * This automatically handles matrices by expanding them into multiple attributes
     * (e.g., mat3 becomes 3 FLOAT4 attributes at consecutive locations).
     *
     * @param bufferSlot - The buffer slot to use for all attributes (default: 0)
     * @returns Array of GPUVertexAttribute descriptors for SDL3
     *
     * @example
     * ```typescript
     * const attributes = mesh.getVertexAttributes(0);
     *
     * const pipeline = dev.createGraphicsPipeline({
     *     ...defaultGraphicsPipelineCreateInfo,
     *     vertex_input_state: {
     *         num_vertex_buffers: 1,
     *         vertex_buffer_descriptions: [...],
     *         num_vertex_attributes: attributes.length,
     *         vertex_attributes: attributes,
     *     },
     * });
     * ```
     */
    getVertexAttributes(bufferSlot: number = 0): GPUVertexAttribute[] {
        const attributes: GPUVertexAttribute[] = [];
        let location = 0;

        for (const attr of this.layout) {
            const offset = this.attributeOffsets.get(attr.name);
            if (offset === undefined) {
                continue;
            }

            const format = this.getVertexElementFormat(attr.type);
            const locationCount = this.getAttributeLocationCount(attr.type);

            // For matrices, create multiple attributes (one per column)
            for (let i = 0; i < locationCount; i++) {
                const columnOffset = offset + (i * 16); // Each column is 16 bytes (vec4)
                attributes.push({
                    location: location++,
                    buffer_slot: bufferSlot,
                    format: format,
                    offset: columnOffset,
                });
            }
        }

        return attributes;
    }

    /**
     * Get the total number of vertices in this buffer.
     */
    getVertexCount(): number {
        return this.vertexCount;
    }

    /**
     * Get the total number of indices in this buffer.
     */
    getIndexCount(): number {
        return this.indexCount;
    }

    /**
     * Get the size of a single vertex in bytes.
     */
    getVertexSize(): number {
        return this.vertexSize;
    }

    /**
     * Get the total vertex buffer size in bytes.
     */
    getVertexBufferSize(): number {
        return this.vertexBuffer.byteLength;
    }

    /**
     * Get the total index buffer size in bytes.
     */
    getIndexBufferSize(): number {
        return this.indexBuffer.byteLength;
    }

    /**
     * Get the index element type.
     */
    getIndexType(): IndexType {
        return this.indexType;
    }

    /**
     * Get the underlying vertex ArrayBuffer.
     *
     * This is the most efficient way to upload to GPU - it's a direct reference
     * to the backing buffer with no copying involved.
     *
     * @returns The raw ArrayBuffer containing all vertex data
     *
     * @example
     * ```typescript
     * const vertexData = mesh.getVertexBuffer();
     * // Upload to SDL3 GPU buffer using transfer buffer...
     * ```
     */
    getVertexBuffer(): ArrayBuffer {
        return this.vertexBuffer;
    }

    /**
     * Get the underlying index ArrayBuffer.
     *
     * @returns The raw ArrayBuffer containing all index data
     */
    getIndexBuffer(): ArrayBuffer {
        return this.indexBuffer;
    }

    /**
     * Copy vertex data to an existing ArrayBuffer.
     *
     * Useful when you need to write into a pre-allocated buffer or when
     * combining multiple mesh buffers into a single upload.
     *
     * @param target - The destination ArrayBuffer
     * @param targetOffset - Byte offset in the target buffer (default: 0)
     *
     * @example
     * ```typescript
     * const uploadBuffer = new ArrayBuffer(1024);
     * mesh.copyVertexBufferTo(uploadBuffer, 0);
     * ```
     */
    copyVertexBufferTo(target: ArrayBuffer, targetOffset: number = 0): void {
        if (targetOffset + this.vertexBuffer.byteLength > target.byteLength) {
            throw new Error("Target buffer is too small");
        }

        const targetView = new Uint8Array(target, targetOffset, this.vertexBuffer.byteLength);
        const sourceView = new Uint8Array(this.vertexBuffer);
        targetView.set(sourceView);
    }

    /**
     * Copy index data to an existing ArrayBuffer.
     *
     * @param target - The destination ArrayBuffer
     * @param targetOffset - Byte offset in the target buffer (default: 0)
     */
    copyIndexBufferTo(target: ArrayBuffer, targetOffset: number = 0): void {
        if (targetOffset + this.indexBuffer.byteLength > target.byteLength) {
            throw new Error("Target buffer is too small");
        }

        const targetView = new Uint8Array(target, targetOffset, this.indexBuffer.byteLength);
        const sourceView = new Uint8Array(this.indexBuffer);
        targetView.set(sourceView);
    }

    /**
     * Get a Float32Array view of the entire vertex buffer.
     *
     * Useful for bulk operations or debugging. Note that this interprets
     * the entire buffer as Float32, which may not be appropriate if you
     * have double-precision attributes.
     *
     * @returns A Float32Array view of the entire vertex buffer
     */
    asFloat32Array(): Float32Array {
        return new Float32Array(this.vertexBuffer);
    }

    /**
     * Clear all vertex data to zeros.
     *
     * This is a fast operation that resets the entire vertex buffer.
     */
    clearVertices(): void {
        const view = new Uint8Array(this.vertexBuffer);
        view.fill(0);
    }

    /**
     * Clear all index data to zeros.
     *
     * This is a fast operation that resets the entire index buffer.
     */
    clearIndices(): void {
        const view = new Uint8Array(this.indexBuffer);
        view.fill(0);
    }

    /**
     * Clear all vertex and index data to zeros.
     */
    clear(): void {
        this.clearVertices();
        this.clearIndices();
    }

    /**
     * Get the layout definition.
     */
    getLayout(): readonly AttributeDescriptor[] {
        return this.layout;
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
            mat3: 48,      // 3 columns × 16 bytes (vec4 alignment)
            mat4: 64,
            f64: 8,
            vec2d: 16,
            vec3d: 24,
            vec4d: 32,
            mat3d: 96,     // 3 columns × 32 bytes (vec4d alignment)
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
            mat3: 12,      // 3 columns × 4 components (padded to vec4)
            mat4: 16,
            f64: 1,
            vec2d: 2,
            vec3d: 3,
            vec4d: 4,
            mat3d: 12,     // 3 columns × 4 components (padded to vec4d)
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
     * Maps attribute types to SDL3 GPUVertexElementFormat.
     * For matrices, returns the format for a single column.
     */
    private getVertexElementFormat(type: AttributeType): GPUVertexElementFormat {
        const formats: Record<AttributeType, GPUVertexElementFormat> = {
            f32: GPUVertexElementFormat.FLOAT,
            vec2: GPUVertexElementFormat.FLOAT2,
            vec3: GPUVertexElementFormat.FLOAT3,
            vec4: GPUVertexElementFormat.FLOAT4,
            mat3: GPUVertexElementFormat.FLOAT4,  // Each column as FLOAT4
            mat4: GPUVertexElementFormat.FLOAT4,  // Each column as FLOAT4
            f64: GPUVertexElementFormat.FLOAT,  // SDL3 doesn't have double formats, use float
            vec2d: GPUVertexElementFormat.FLOAT2,
            vec3d: GPUVertexElementFormat.FLOAT3,
            vec4d: GPUVertexElementFormat.FLOAT4,
            mat3d: GPUVertexElementFormat.FLOAT4,
            mat4d: GPUVertexElementFormat.FLOAT4,
        };
        return formats[type];
    }

    /**
     * Returns the number of vertex attribute locations needed for a type.
     * Vectors and scalars use 1 location, matrices use multiple (3 for mat3, 4 for mat4).
     */
    private getAttributeLocationCount(type: AttributeType): number {
        if (type === "mat3" || type === "mat3d") {
            return 3;
        }
        if (type === "mat4" || type === "mat4d") {
            return 4;
        }
        return 1;
    }
}
