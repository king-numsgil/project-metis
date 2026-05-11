import type { F32Descriptor, MatMemoryBuffer } from "metis-data";
import type { VectorContext } from "metis-vector";
import type { PaintMemoryBuffer } from "./paint.ts";
import type { RootWidget } from "./root_widget.ts";
import type { WidgetID } from "./widget_id.ts";

export interface IWidget {
    owner: RootWidget | null;

    get isDirty(): boolean;

    get modelMatrix(): MatMemoryBuffer<F32Descriptor, 4>;

    get paint(): PaintMemoryBuffer;

    get id(): WidgetID;

    render(ctx: VectorContext): void;
}
