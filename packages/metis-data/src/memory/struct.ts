import type { Descriptor, DescriptorTypedArray, StructDescriptor } from "../descriptors";
import { type DescriptorToMemoryBuffer, type StructMemoryBuffer, wrap } from "./index.ts";

export class StructMemoryBufferImpl<
    Members extends Record<string, Descriptor<DescriptorTypedArray>>,
> implements StructMemoryBuffer<Members> {
    public readonly buffer: ArrayBuffer;
    public readonly offset: number;
    public readonly type: StructDescriptor<Members>;

    public constructor(descriptor: StructDescriptor<Members>, buffer: ArrayBuffer, offset: number) {
        this.type = descriptor;
        this.buffer = buffer;
        this.offset = offset;
    }

    public get members(): Members {
        return this.type.members;
    }

    public view(): ReturnType<StructDescriptor<Members>["view"]> {
        return this.type.view(this.buffer, this.offset);
    }

    public get<K extends keyof Members>(name: K): DescriptorToMemoryBuffer<Members[K]> {
        const offset = this.offset + this.type.offsetOf(name);
        return wrap(this.members[name], this.buffer, offset);
    }
}
