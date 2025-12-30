import { Device, DeviceBuffer, GPUBufferUsageFlags, GPUTransferBufferUsage } from "sdl3";
import type { Descriptor, DescriptorTypedArray } from "./descriptors";
import type { MemoryBuffer } from "./memory";

export function createDeviceBuffer(
    device: Device,
    memoryBuffer: MemoryBuffer<Descriptor<DescriptorTypedArray>>,
    usage: GPUBufferUsageFlags,
): DeviceBuffer {
    const buffer = device.createBuffer({
        usage: usage,
        size: memoryBuffer.type.byteSize,
    });

    using transfer = device.createTransferBuffer({
        usage: GPUTransferBufferUsage.Upload,
        size: memoryBuffer.type.byteSize,
    });

    transfer.map(array_buffer => {
        const targetView = new Uint8Array(array_buffer, 0, memoryBuffer.type.byteSize);
        const sourceView = new Uint8Array(memoryBuffer.buffer);
        targetView.set(sourceView);
    });

    const cb = device.acquireCommandBuffer();
    const copy = cb.beginCopyPass();
    copy.uploadToDeviceBuffer({
        transfer_buffer: transfer.raw,
        offset: 0,
    }, {
        buffer: buffer.raw,
        offset: 0,
        size: memoryBuffer.type.byteSize,
    });
    copy.end();

    using fence = cb.submitWithFence();
    fence.wait();

    return buffer;
}
