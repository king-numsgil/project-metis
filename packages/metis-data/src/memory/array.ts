import type { IntRange } from "type-fest";

import type { ArrayDescriptor, Descriptor, DescriptorMemoryType, DescriptorTypedArray } from "../descriptors";
import { type ArrayMemoryBuffer, type DescriptorToMemoryBuffer, wrap } from "./index.ts";

export class ArrayMemoryBufferImpl<
    ItemType extends Descriptor<DescriptorTypedArray>,
    N extends number,
> implements ArrayMemoryBuffer<ItemType, N> {
    public readonly buffer: ArrayBuffer;
    public readonly offset: number;
    public readonly type: ArrayDescriptor<ItemType, N>;

    public constructor(descriptor: ArrayDescriptor<ItemType, N>, buffer: ArrayBuffer, offset: number) {
        this.type = descriptor;
        this.buffer = buffer;
        this.offset = offset;
    }

    public view(): DescriptorMemoryType<ItemType> {
        return this.type.view(this.buffer, this.offset);
    }

    public at(index: IntRange<0, N>): DescriptorToMemoryBuffer<ItemType> {
        const itemOffset = this.offset + this.type.offsetAt(index);
        return wrap(this.type.item, this.buffer, itemOffset);
    }

    public [Symbol.iterator](): Iterator<DescriptorToMemoryBuffer<ItemType>> {
        let index = 0;
        const length = this.type.length;

        return {
            next: (): IteratorResult<DescriptorToMemoryBuffer<ItemType>> => {
                if (index < length) {
                    const value = this.at(index as IntRange<0, N>);
                    index++;
                    return { value, done: false };
                }
                return { value: undefined, done: true };
            }
        };
    }
}
