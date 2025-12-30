import { GPU_F16, GPU_F32, GPU_F64, GPU_I32, GPU_U32, GPU_VEC2, GPU_VEC3, GPU_VEC4 } from "./constants.ts";
import {
    type DescriptorMemoryType,
    PackingType,
    type ScalarDescriptor,
    type VecDescriptor,
    type VectorTypeSelector,
} from "./index.ts";

type TypedArrayConstructor =
    | typeof Float16Array
    | typeof Float32Array
    | typeof Float64Array
    | typeof Int32Array
    | typeof Uint32Array;

const TYPED_ARRAY_CONSTRUCTORS: Record<string, TypedArrayConstructor> = {
    [GPU_F16]: Float16Array,
    [GPU_F32]: Float32Array,
    [GPU_F64]: Float64Array,
    [GPU_I32]: Int32Array,
    [GPU_U32]: Uint32Array,
};

export class VecDescriptorImpl<
    ScalarType extends ScalarDescriptor,
    N extends 2 | 3 | 4
> implements VecDescriptor<ScalarType, N> {
    private readonly _scalarDescriptor: ScalarType;
    private readonly _n: N;
    private readonly _type: VectorTypeSelector<N>;
    private readonly _byteSize: number;
    private readonly _alignment: number;
    private readonly _arrayPitch: number;

    constructor(scalarDescriptor: ScalarType, n: N, packingType: PackingType = PackingType.Dense) {
        this._scalarDescriptor = scalarDescriptor;
        this._n = n;
        this._type = (n === 2 ? GPU_VEC2 : n === 3 ? GPU_VEC3 : GPU_VEC4) as VectorTypeSelector<N>;

        const scalarSize = scalarDescriptor.byteSize;

        this._byteSize = n * scalarSize;

        if (packingType === PackingType.Dense) {
            this._alignment = scalarSize;
            this._arrayPitch = this._byteSize;
        } else {
            if (n === 2) {
                this._alignment = Math.max(8, 2 * scalarSize);
            } else {
                this._alignment = Math.max(16, 4 * scalarSize);
            }
        }

        if (packingType === PackingType.Dense) {
            this._arrayPitch = Math.ceil(this._byteSize / this._alignment) * this._alignment;
        } else {
            this._arrayPitch = Math.max(
                16,
                Math.ceil(this._byteSize / this._alignment) * this._alignment,
            );
        }
    }

    public get type(): VectorTypeSelector<N> {
        return this._type;
    }

    public get scalar(): ScalarType {
        return this._scalarDescriptor;
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

    public get length(): N {
        return this._n;
    }

    public toString(): string {
        return `${this._type}<${this._scalarDescriptor.type}>`;
    }

    public view(buffer: ArrayBuffer, offset: number): DescriptorMemoryType<ScalarType> {
        const TypedArrayConstructor = TYPED_ARRAY_CONSTRUCTORS[this._scalarDescriptor.type]!;
        return new TypedArrayConstructor(buffer, offset, this._n) as DescriptorMemoryType<ScalarType>;
    }
}
