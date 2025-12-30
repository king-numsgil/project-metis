import { GPU_ARRAY, GPU_BOOL, GPU_F16, GPU_F32, GPU_F64, GPU_I32, GPU_STRUCT, GPU_U32 } from "./constants.ts";
import type { ArrayDescriptor, Descriptor, DescriptorTypedArray } from "./index.ts";

type TypedArrayConstructor =
    | typeof Float16Array
    | typeof Float32Array
    | typeof Float64Array
    | typeof Int32Array
    | typeof Uint32Array
    | typeof Uint8Array;

const TYPED_ARRAY_CONSTRUCTORS: Record<string, TypedArrayConstructor> = {
    [GPU_F16]: Float16Array,
    [GPU_F32]: Float32Array,
    [GPU_F64]: Float64Array,
    [GPU_I32]: Int32Array,
    [GPU_U32]: Uint32Array,
    [GPU_BOOL]: Uint32Array,
    [GPU_STRUCT]: Uint8Array,
};

export class ArrayDescriptorImpl<
    ItemType extends Descriptor<MemoryType>,
    N extends number,
    MemoryType extends DescriptorTypedArray,
> implements ArrayDescriptor<ItemType, N, MemoryType> {
    private readonly _itemDescriptor: ItemType;
    private readonly _length: N;
    private readonly _byteSize: number;
    private readonly _alignment: number;
    private readonly _arrayPitch: number;

    constructor(itemDescriptor: ItemType, length: N) {
        this._itemDescriptor = itemDescriptor;
        this._length = length;
        this._alignment = itemDescriptor.alignment;
        this._arrayPitch = itemDescriptor.arrayPitch;
        this._byteSize = length * this._arrayPitch;
    }

    public get type(): typeof GPU_ARRAY {
        return GPU_ARRAY;
    }

    public get item(): ItemType {
        return this._itemDescriptor;
    }

    public get length(): N {
        return this._length;
    }

    public get byteSize(): number {
        return this._byteSize;
    }

    public get alignment(): number {
        return this._alignment;
    }

    public get arrayPitch(): number {
        return this._arrayPitch;
    }

    public toString(): string {
        return `${GPU_ARRAY}<${this._itemDescriptor.toString()}, ${this._length}>`;
    }

    public offsetAt(index: number): number {
        if (index < 0 || index >= this._length) {
            throw new RangeError(`Array index ${index} out of range [0, ${this._length})`);
        }
        return index * this._arrayPitch;
    }

    public view(buffer: ArrayBuffer, offset: number): MemoryType {
        if (this._itemDescriptor.type === GPU_STRUCT) {
            return new Uint8Array(buffer, offset, this._byteSize) as MemoryType;
        }

        const TypedArrayConstructor = TYPED_ARRAY_CONSTRUCTORS[this._itemDescriptor.type]!;
        const elementCount = (this._byteSize / this._itemDescriptor.byteSize);
        return new TypedArrayConstructor(buffer, offset, elementCount) as MemoryType;
    }

    public at(buffer: ArrayBuffer, offset: number, index: number): MemoryType {
        const elementByteOffset = offset + this.offsetAt(index);
        return this._itemDescriptor.view(buffer, elementByteOffset);
    }
}
