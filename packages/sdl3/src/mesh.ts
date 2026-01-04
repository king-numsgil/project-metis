import {
    Device,
    DeviceBuffer,
    GPUBufferUsageFlags,
    GPUTransferBufferUsage,
    type GPUVertexAttribute,
    GPUVertexElementFormat,
} from "sdl3";
import {
    allocate,
    type ArrayDescriptor,
    type ArrayMemoryBuffer,
    type Descriptor,
    type DescriptorTypedArray,
    type ScalarDescriptor,
    type StructDescriptor,
    type VecDescriptor,
} from "metis-data";

/**
 * Supported index element sizes for index buffers.
 */
type IndexType = "uint16" | "uint32";

/**
 * A type-safe mesh buffer that manages GPU-compatible vertex and index data using
 * the descriptor DSL for automatic memory layout.
 *
 * Features:
 * - Type-safe vertex attribute access through descriptor DSL
 * - Integrated index buffer management (uint16 or uint32)
 * - Zero-copy views into the underlying buffers for efficient manipulation
 * - Automatic std140/std430 alignment handled by descriptors
 * - Direct ArrayBuffer access for efficient GPU uploads
 * - Support for both single and double precision attributes
 * - Automatic generation of SDL3 vertex attribute descriptors
 *
 * @template T - The vertex descriptor (must be a struct descriptor)
 *
 * @example
 * ```typescript
 * import { StructOf, Vec, F32, ArrayOf } from "@metis/data";
 *
 * const vertexDescriptor = StructOf({
 *     position: Vec(F32, 3),
 *     normal: Vec(F32, 3),
 *     color: Vec(F32, 4)
 * });
 *
 * const mesh = new Mesh(ArrayOf(vertexDescriptor, 1000), 3000);
 *
 * // Set vertex data
 * const vertex = mesh.vertices.at(0);
 * vertex.get("position").set([1, 2, 3]);
 * vertex.get("normal").set([0, 1, 0]);
 * vertex.get("color").set([1, 0, 0, 1]);
 *
 * // Set indices
 * mesh.setIndices([0, 1, 2, 0, 2, 3]);
 *
 * // Generate SDL3 vertex attributes
 * const attributes = mesh.getVertexAttributes();
 *
 * // Upload to GPU
 * const vertexBuffer = mesh.createVertexDeviceBuffer(device);
 * const indexBuffer = mesh.createIndexDeviceBuffer(device);
 * ```
 */
export class Mesh<
    T extends StructDescriptor<Record<string, Descriptor<DescriptorTypedArray>>>,
    N extends number,
> {
    /** The array descriptor for vertices */
    private readonly _vertexDescriptor: ArrayDescriptor<T, N>;

    /** The memory buffer managing vertex data */
    private readonly _vertices: ArrayMemoryBuffer<T, N>;

    /** The underlying ArrayBuffer storing all index data */
    private readonly _indexBuffer: ArrayBuffer;

    /** Total number of indices in the buffer */
    private readonly _indexCount: number;

    /** The index element type (uint16 or uint32) */
    private readonly _indexType: IndexType;

    /**
     * Creates a new mesh buffer with the specified vertex descriptor and capacity.
     *
     * @param vertexDescriptor - Array descriptor defining the vertex structure and count
     * @param indexCount - Number of indices to allocate space for (default: 0)
     * @param indexType - Index element size: "uint16" or "uint32" (default: "uint16")
     *
     * @example
     * ```typescript
     * import { StructOf, Vec, F32, ArrayOf } from "@metis/data";
     *
     * const vertexLayout = StructOf({
     *     position: Vec(F32, 3),
     *     uv: Vec(F32, 2)
     * });
     *
     * const mesh = new Mesh(ArrayOf(vertexLayout, 100), 300, "uint16");
     * ```
     */
    constructor(
        vertexDescriptor: ArrayDescriptor<T, N>,
        indexCount: number = 0,
        indexType: IndexType = "uint16",
    ) {
        this._vertexDescriptor = vertexDescriptor;
        this._vertices = allocate(vertexDescriptor);
        this._indexCount = indexCount;
        this._indexType = indexType;

        // Allocate index buffer
        const indexElementSize = indexType === "uint16" ? 2 : 4;
        this._indexBuffer = new ArrayBuffer(indexElementSize * indexCount);
    }

    /**
     * Get direct access to the vertex array memory buffer.
     * This provides typed access to all vertices through the descriptor DSL.
     *
     * @example
     * ```typescript
     * // Access individual vertices
     * const vertex0 = mesh.vertices.at(0);
     * vertex0.get("position").set([1, 2, 3]);
     *
     * // Iterate over all vertices
     * for (const vertex of mesh.vertices) {
     *     const pos = vertex.get("position").get();
     *     console.log(pos);
     * }
     * ```
     */
    get vertices(): ArrayMemoryBuffer<T, N> {
        return this._vertices;
    }

    /**
     * Get the vertex descriptor.
     */
    get vertexDescriptor(): ArrayDescriptor<T, N> {
        return this._vertexDescriptor;
    }

    /**
     * Get the total number of vertices in this buffer.
     */
    get vertexCount(): number {
        return this._vertexDescriptor.length;
    }

    /**
     * Get the total number of indices in this buffer.
     */
    get indexCount(): number {
        return this._indexCount;
    }

    /**
     * Get the size of a single vertex in bytes.
     */
    get vertexSize(): number {
        return this._vertexDescriptor.item.byteSize;
    }

    /**
     * Get the total vertex buffer size in bytes.
     */
    get vertexBufferSize(): number {
        return this._vertexDescriptor.byteSize;
    }

    /**
     * Get the total index buffer size in bytes.
     */
    get indexBufferSize(): number {
        return this._indexBuffer.byteLength;
    }

    /**
     * Get the index element type.
     */
    get indexType(): IndexType {
        return this._indexType;
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
     * const vertexData = mesh.vertexBuffer;
     * // Upload to SDL3 GPU buffer using transfer buffer...
     * ```
     */
    get vertexBuffer(): ArrayBuffer {
        return this._vertices.buffer;
    }

    /**
     * Get the underlying index ArrayBuffer.
     *
     * @returns The raw ArrayBuffer containing all index data
     */
    get indexBuffer(): ArrayBuffer {
        return this._indexBuffer;
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
        if (indices.length > this._indexCount) {
            throw new Error(`Index array length ${indices.length} exceeds buffer capacity ${this._indexCount}`);
        }

        if (this._indexType === "uint16") {
            const view = new Uint16Array(this._indexBuffer);
            view.set(indices);
        } else {
            const view = new Uint32Array(this._indexBuffer);
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
        if (index < 0 || index >= this._indexCount) {
            throw new Error(`Index ${index} out of bounds`);
        }

        if (this._indexType === "uint16") {
            const view = new Uint16Array(this._indexBuffer);
            view[index] = value;
        } else {
            const view = new Uint32Array(this._indexBuffer);
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
        if (index < 0 || index >= this._indexCount) {
            throw new Error(`Index ${index} out of bounds`);
        }

        if (this._indexType === "uint16") {
            const view = new Uint16Array(this._indexBuffer);
            return view[index]!;
        } else {
            const view = new Uint32Array(this._indexBuffer);
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
        if (this._indexType === "uint16") {
            return new Uint16Array(this._indexBuffer);
        } else {
            return new Uint32Array(this._indexBuffer);
        }
    }

    /**
     * Generate SDL3 vertex attribute descriptors for this mesh's layout.
     *
     * This automatically handles the descriptor structure and generates
     * appropriate vertex attributes for SDL3.
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
        const structDescriptor = this._vertexDescriptor.item;
        let location = 0;

        for (const [name, offset] of Object.entries(structDescriptor.offsets)) {
            const member = structDescriptor.members[name];
            if (!member) {
                continue;
            }

            const format = this.getVertexElementFormat(member);
            attributes.push({
                location: location++,
                buffer_slot: bufferSlot,
                format: format,
                offset: offset,
            });
        }

        return attributes;
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
        if (targetOffset + this._vertices.buffer.byteLength > target.byteLength) {
            throw new Error("Target buffer is too small");
        }

        const targetView = new Uint8Array(target, targetOffset, this._vertices.buffer.byteLength);
        const sourceView = new Uint8Array(this._vertices.buffer);
        targetView.set(sourceView);
    }

    /**
     * Copy index data to an existing ArrayBuffer.
     *
     * @param target - The destination ArrayBuffer
     * @param targetOffset - Byte offset in the target buffer (default: 0)
     */
    copyIndexBufferTo(target: ArrayBuffer, targetOffset: number = 0): void {
        if (targetOffset + this._indexBuffer.byteLength > target.byteLength) {
            throw new Error("Target buffer is too small");
        }

        const targetView = new Uint8Array(target, targetOffset, this._indexBuffer.byteLength);
        const sourceView = new Uint8Array(this._indexBuffer);
        targetView.set(sourceView);
    }

    /**
     * Clear all vertex data to zeros.
     *
     * This is a fast operation that resets the entire vertex buffer.
     */
    clearVertices(): void {
        const view = new Uint8Array(this._vertices.buffer);
        view.fill(0);
    }

    /**
     * Clear all index data to zeros.
     *
     * This is a fast operation that resets the entire index buffer.
     */
    clearIndices(): void {
        const view = new Uint8Array(this._indexBuffer);
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
     * Create and upload a vertex buffer to the GPU device.
     *
     * @param device - The SDL3 device to create the buffer on
     * @returns A DeviceBuffer containing the vertex data
     */
    createVertexDeviceBuffer(device: Device): DeviceBuffer {
        const buffer = device.createBuffer({
            usage: GPUBufferUsageFlags.Vertex,
            size: this.vertexBufferSize,
        });

        using transfer = device.createTransferBuffer({
            usage: GPUTransferBufferUsage.Upload,
            size: this.vertexBufferSize,
        });

        transfer.map(array_buffer => {
            this.copyVertexBufferTo(array_buffer);
        });

        const cb = device.acquireCommandBuffer();
        const copy = cb.beginCopyPass();
        copy.uploadToDeviceBuffer({
            transfer_buffer: transfer.raw,
            offset: 0,
        }, {
            buffer: buffer.raw,
            offset: 0,
            size: this.vertexBufferSize,
        });
        copy.end();

        using fence = cb.submitWithFence();
        fence.wait();

        return buffer;
    }

    /**
     * Create and upload an index buffer to the GPU device.
     *
     * @param device - The SDL3 device to create the buffer on
     * @returns A DeviceBuffer containing the index data
     */
    createIndexDeviceBuffer(device: Device): DeviceBuffer {
        const buffer = device.createBuffer({
            usage: GPUBufferUsageFlags.Index,
            size: this.indexBufferSize,
        });

        using transfer = device.createTransferBuffer({
            usage: GPUTransferBufferUsage.Upload,
            size: this.indexBufferSize,
        });

        transfer.map(array_buffer => {
            this.copyIndexBufferTo(array_buffer);
        });

        const cb = device.acquireCommandBuffer();
        const copy = cb.beginCopyPass();
        copy.uploadToDeviceBuffer({
            transfer_buffer: transfer.raw,
            offset: 0,
        }, {
            buffer: buffer.raw,
            offset: 0,
            size: this.indexBufferSize,
        });
        copy.end();

        using fence = cb.submitWithFence();
        fence.wait();

        return buffer;
    }

    /**
     * Maps descriptor types to SDL3 GPUVertexElementFormat.
     */
    private getVertexElementFormat(descriptor: Descriptor<DescriptorTypedArray>): GPUVertexElementFormat {
        const type = descriptor.type;

        switch (type) {
            case "f32":
            case "f64":
                return GPUVertexElementFormat.FLOAT;
            case "i32":
                return GPUVertexElementFormat.INT;
            case "u32":
                return GPUVertexElementFormat.UINT;
            case "bool":
                return GPUVertexElementFormat.UINT;
            case "vec2": {
                const vecDesc = descriptor as VecDescriptor<ScalarDescriptor, 2>;
                const scalarType = vecDesc.scalar.type;
                if (scalarType === "f32" || scalarType === "f64") {
                    return GPUVertexElementFormat.FLOAT2;
                }
                if (scalarType === "i32") {
                    return GPUVertexElementFormat.INT2;
                }
                if (scalarType === "u32") {
                    return GPUVertexElementFormat.UINT2;
                }
                return GPUVertexElementFormat.FLOAT2;
            }
            case "vec3": {
                const vecDesc = descriptor as VecDescriptor<ScalarDescriptor, 3>;
                const scalarType = vecDesc.scalar.type;
                if (scalarType === "f32" || scalarType === "f64") {
                    return GPUVertexElementFormat.FLOAT3;
                }
                if (scalarType === "i32") {
                    return GPUVertexElementFormat.INT3;
                }
                if (scalarType === "u32") {
                    return GPUVertexElementFormat.UINT3;
                }
                return GPUVertexElementFormat.FLOAT3;
            }
            case "vec4": {
                const vecDesc = descriptor as VecDescriptor<ScalarDescriptor, 4>;
                const scalarType = vecDesc.scalar.type;
                if (scalarType === "f32" || scalarType === "f64") {
                    return GPUVertexElementFormat.FLOAT4;
                }
                if (scalarType === "i32") {
                    return GPUVertexElementFormat.INT4;
                }
                if (scalarType === "u32") {
                    return GPUVertexElementFormat.UINT4;
                }
                return GPUVertexElementFormat.FLOAT4;
            }
            default:
                return GPUVertexElementFormat.FLOAT;
        }
    }
}
