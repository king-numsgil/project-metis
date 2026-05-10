import { type DescriptorToMemoryBuffer, F32, PackingType, StructOf, Vec } from "metis-data";

export const Paint = StructOf({
    color_a: Vec(F32, 4),
    color_b: Vec(F32, 4),
    gradient_start: Vec(F32, 2),
    gradient_end: Vec(F32, 2),
    mode: F32,
}, PackingType.Uniform);

export type PaintMemoryBuffer = DescriptorToMemoryBuffer<typeof Paint>;

export function paint_flat(
    paint: PaintMemoryBuffer,
    color: [number, number, number, number],
): void {
    paint.get("color_a").set(color);
    paint.get("color_b").set([0, 0, 0, 0]);
    paint.get("gradient_start").set([0, 0]);
    paint.get("gradient_end").set([0, 0]);
    paint.get("mode").set(0);
}

export function paint_linear(
    paint: PaintMemoryBuffer,
    color_a: [number, number, number, number],
    color_b: [number, number, number, number],
    start: [number, number],
    end: [number, number],
): void {
    paint.get("color_a").set(color_a);
    paint.get("color_b").set(color_b);
    paint.get("gradient_start").set(start);
    paint.get("gradient_end").set(end);
    paint.get("mode").set(1);
}

export function paint_radial(
    paint: PaintMemoryBuffer,
    color_a: [number, number, number, number],
    color_b: [number, number, number, number],
    center: [number, number],
    radius: number,
): void {
    paint.get("color_a").set(color_a);
    paint.get("color_b").set(color_b);
    paint.get("gradient_start").set(center);
    paint.get("gradient_end").set([center[0] + radius, center[1]]);
    paint.get("mode").set(2);
}
