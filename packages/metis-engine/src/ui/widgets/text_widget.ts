import { allocate, F32, type F32Descriptor, Mat4, type MatMemoryBuffer } from "metis-data";
import type { VectorContext } from "metis-vector";
import type { IWidget } from "../interfaces.ts";
import { Paint, paint_flat, type PaintMemoryBuffer } from "../paint.ts";
import type { RootWidget } from "../root_widget.ts";
import { nextWidgetID, type WidgetID } from "../widget_id.ts";

export class TextWidget implements IWidget {
    private readonly _id: WidgetID;
    private readonly paintBuffer: PaintMemoryBuffer;
    private readonly model: MatMemoryBuffer<F32Descriptor, 4>;
    private dirty: boolean = true;

    public constructor(text: string, size: number, position: [number, number], color: [number, number, number, number] = [0, 0, 0, 1]) {
        this._text = text;
        this._position = position;
        this._size = size;
        this._id = nextWidgetID();
        this.paintBuffer = allocate(Paint);
        paint_flat(this.paintBuffer, color);
        this.model = Mat4.identity(F32);
    }

    private _text: string;

    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        this._text = value;
        this.dirty = true;
    }

    private _position: [number, number];

    public get position(): [number, number] {
        return this._position;
    }

    public set position(value: [number, number]) {
        this._position = value;
        this.dirty = true;
    }

    private _size: number;

    public get size(): number {
        return this._size;
    }

    public set size(value: number) {
        this._size = value;
        this.dirty = true;
    }

    public get isDirty(): boolean {
        return this.dirty;
    }

    public get modelMatrix(): MatMemoryBuffer<F32Descriptor, 4> {
        return this.model;
    }

    public get paint(): PaintMemoryBuffer {
        return this.paintBuffer;
    }

    public get id(): WidgetID {
        return this._id;
    }

    public owner: RootWidget | null = null;

    public render(ctx: VectorContext): void {
        ctx.setId(this._id);
        ctx.drawText(this._text, "Inter", this._size, this._position[0], this._position[1]);
        ctx.fill();
        this.dirty = false;
    }

    public get color(): [number, number, number, number] {
        return this.paintBuffer.get("color_a").get();
    }

    public set color(value: [number, number, number, number]) {
        this.paintBuffer.get("color_a").set(value);
    }
}
