import { GPU_STRUCT } from "./constants.ts";
import {
    type Descriptor,
    type DescriptorMemoryType,
    type DescriptorTypedArray,
    PackingType,
    type StructDescriptor,
} from "./index.ts";

export class StructDescriptorImpl<
    Members extends Record<string, Descriptor<DescriptorTypedArray>>,
> implements StructDescriptor<Members> {
    private readonly _members: Members;
    private readonly _offsets: Record<keyof Members, number>;
    private readonly _byteSize: number;
    private readonly _alignment: number;
    private readonly _arrayPitch: number;

    constructor(members: Members, packingType: PackingType = PackingType.Dense) {
        this._members = members;
        this._offsets = {} as Record<keyof Members, number>;

        let currentOffset = 0;
        let maxAlignment = 0;

        // Calculate offsets for each member according to std140 rules
        for (const key of Object.keys(members) as Array<keyof Members>) {
            const member = members[key]!;
            const memberAlignment = member.alignment;

            maxAlignment = Math.max(maxAlignment, memberAlignment);
            currentOffset = Math.ceil(currentOffset / memberAlignment) * memberAlignment;
            this._offsets[key] = currentOffset;
            currentOffset += member.byteSize;
        }

        this._alignment = maxAlignment;
        this._byteSize = Math.ceil(currentOffset / this._alignment) * this._alignment;

        if (packingType === PackingType.Dense) {
            // Array pitch: round up to alignment
            this._arrayPitch = this._byteSize;
        } else {
            // Array pitch for std140: round up to next multiple of 16 bytes
            this._arrayPitch = Math.max(16, Math.ceil(this._byteSize / 16) * 16);
        }
    }

    public get type(): typeof GPU_STRUCT {
        return GPU_STRUCT;
    }

    public get members(): Members {
        return this._members;
    }

    public get offsets(): Record<keyof Members, number> {
        return {...this._offsets};
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
        const memberStrings = Object.keys(this._members)
            .map(key => `${String(key)}: ${this._members[key]!.toString()}`)
            .join(", ");
        return `${GPU_STRUCT} { ${memberStrings} }`;
    }

    public offsetOf<K extends keyof Members>(name: K): number {
        if (!(name in this._offsets)) {
            throw new Error(`Member "${String(name)}" does not exist in struct`);
        }
        return this._offsets[name];
    }

    public view(buffer: ArrayBuffer, offset: number): Uint8Array {
        return new Uint8Array(buffer, offset, this._byteSize);
    }

    public member<K extends keyof Members>(
        buffer: ArrayBuffer,
        offset: number,
        name: K,
    ): DescriptorMemoryType<Members[K]> {
        if (!(name in this._offsets)) {
            throw new Error(`Member "${String(name)}" does not exist in struct`);
        }

        const memberOffset = this._offsets[name]!;
        const memberDescriptor = this._members[name]!;

        return memberDescriptor.view(buffer, offset + memberOffset) as DescriptorMemoryType<Members[K]>;
    }
}
