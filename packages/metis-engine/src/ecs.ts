import type { Tagged } from "type-fest";
import type {
    BoolMemoryBuffer,
    Descriptor,
    DescriptorToMemoryBuffer,
    DescriptorTypedArray,
    DescriptorValueType,
    MatMemoryBuffer,
    ScalarDescriptor,
    ScalarMemoryBuffer,
    StructDescriptor,
    StructMemoryBuffer,
    VecMemoryBuffer,
} from "metis-data";
import { GPU_BOOL, GPU_MAT2, GPU_MAT3, GPU_MAT4, GPU_STRUCT, GPU_VEC2, GPU_VEC3, GPU_VEC4, wrap } from "metis-data";

// ============================================================================
// Entity
// ============================================================================

export type Entity = Tagged<number, "ECS.Entity">;

// ============================================================================
// Component Definitions
// ============================================================================

/**
 * A data component carries a descriptor that describes its memory layout.
 */
export interface DataComponentDef<
    Name extends string = string,
    D extends Descriptor<DescriptorTypedArray> = Descriptor<DescriptorTypedArray>,
> {
    readonly name: Name;
    readonly descriptor: D;
    readonly __tag: false;
}

/**
 * A tag component has no data — just marks entity membership.
 */
export interface TagComponentDef<Name extends string = string> {
    readonly name: Name;
    readonly descriptor: null;
    readonly __tag: true;
}

export type ComponentDef<
    Name extends string = string,
    D extends Descriptor<DescriptorTypedArray> | null = Descriptor<DescriptorTypedArray> | null,
> = D extends null
    ? TagComponentDef<Name>
    : D extends Descriptor<DescriptorTypedArray>
        ? DataComponentDef<Name, D>
        : never;

/**
 * Define a data component backed by a metis-data descriptor.
 *
 * ```ts
 * const Position = component("Position", StructOf({ x: F32, y: F32, z: F32 }));
 * ```
 */
export function component<
    Name extends string,
    D extends Descriptor<DescriptorTypedArray>,
>(name: Name, descriptor: D): DataComponentDef<Name, D> {
    return {name, descriptor, __tag: false as const};
}

/**
 * Define a tag component (no data, membership only).
 *
 * ```ts
 * const Visible = tag("Visible");
 * ```
 */
export function tag<Name extends string>(name: Name): TagComponentDef<Name> {
    return {name, descriptor: null, __tag: true as const};
}

// ============================================================================
// Type-level Utilities
// ============================================================================

/** Union of all component names in a registry. */
type DefName<Defs extends readonly AnyComponentDef[]> = Defs[number]["name"];

/** Extract a specific def from the registry by name. */
type GetDef<
    Defs extends readonly AnyComponentDef[],
    Name extends string,
> = Extract<Defs[number], { name: Name }>;

/** Extract only data defs from a tuple of defs. */
type DataDefsOnly<Defs extends readonly AnyComponentDef[]> =
    Extract<Defs[number], DataComponentDef>;

/** Build the typed result object for a view query. */
type ViewResultComponents<Defs extends readonly AnyComponentDef[]> = {
    [D in DataDefsOnly<Defs> as D["name"]]: DescriptorToMemoryBuffer<D["descriptor"]>;
};

export type ViewResult<Defs extends readonly AnyComponentDef[]> = {
    entity: Entity;
} & ViewResultComponents<Defs>;

type AnyComponentDef = DataComponentDef | TagComponentDef;

// ============================================================================
// Storage: Sparse-Set + Dense Typed Array
// ============================================================================

const DEFAULT_CAPACITY = 64;

/**
 * Dense storage for data components. Uses a sparse set for O(1) lookups
 * and a flat ArrayBuffer described by the component's descriptor for
 * cache-friendly iteration.
 */
class DataStorage<D extends Descriptor<DescriptorTypedArray>> {
    /** Entity → dense index mapping. */
    private _sparse: Map<number, number> = new Map();
    /** The component's type descriptor. */
    private readonly _descriptor: D;
    /** Current allocated capacity (in elements). */
    private _capacity: number;
    /** Pitch in bytes per element. */
    private readonly _pitch: number;

    constructor(descriptor: D, initialCapacity: number = DEFAULT_CAPACITY) {
        this._descriptor = descriptor;
        this._capacity = initialCapacity;
        this._pitch = descriptor.arrayPitch;
        this._buffer = new ArrayBuffer(this._pitch * initialCapacity);
    }

    /** Packed array of entities that own this component, indexed by dense index. */
    private _dense: Entity[] = [];

    get dense(): readonly Entity[] {
        return this._dense;
    }

    /** The raw backing buffer. Layout: descriptor.arrayPitch * capacity bytes. */
    private _buffer: ArrayBuffer;

    get buffer(): ArrayBuffer {
        return this._buffer;
    }

    /** Number of active components. */
    private _count: number = 0;

    get count(): number {
        return this._count;
    }

    get descriptor(): D {
        return this._descriptor;
    }

    get pitch(): number {
        return this._pitch;
    }

    has(entity: Entity): boolean {
        return this._sparse.has(entity as number);
    }

    /**
     * Returns the dense index for this entity, or -1 if absent.
     */
    indexOf(entity: Entity): number {
        return this._sparse.get(entity as number) ?? -1;
    }

    /**
     * Add a component to an entity. If the entity already has this component,
     * the value is overwritten.
     */
    add(entity: Entity, value: DescriptorValueType<D>): void {
        const existing = this._sparse.get(entity as number);
        if (existing !== undefined) {
            // Overwrite in place.
            writeValue(this._descriptor, this._buffer, existing * this._pitch, value);
            return;
        }

        if (this._count >= this._capacity) {
            this.grow();
        }

        const index = this._count++;
        this._dense[index] = entity;
        this._sparse.set(entity as number, index);
        writeValue(this._descriptor, this._buffer, index * this._pitch, value);
    }

    /**
     * Remove a component from an entity via swap-and-pop.
     * Returns true if the component was removed.
     */
    remove(entity: Entity): boolean {
        const index = this._sparse.get(entity as number);
        if (index === undefined) {
            return false;
        }

        const lastIndex = this._count - 1;

        if (index !== lastIndex) {
            // Swap data bytes.
            const lastEntity = this._dense[lastIndex]!;
            this._dense[index] = lastEntity;
            this._sparse.set(lastEntity as number, index);

            const srcOffset = lastIndex * this._pitch;
            const dstOffset = index * this._pitch;
            const src = new Uint8Array(this._buffer, srcOffset, this._descriptor.byteSize);
            const dst = new Uint8Array(this._buffer, dstOffset, this._descriptor.byteSize);
            dst.set(src);
        }

        this._dense.length = lastIndex;
        this._sparse.delete(entity as number);
        this._count--;
        return true;
    }

    /**
     * Get a typed memory buffer view for an entity's component data.
     * Returns undefined if the entity doesn't have this component.
     */
    getView(entity: Entity): DescriptorToMemoryBuffer<D> | undefined {
        const index = this._sparse.get(entity as number);
        if (index === undefined) {
            return undefined;
        }
        return wrap(this._descriptor, this._buffer, index * this._pitch) as DescriptorToMemoryBuffer<D>;
    }

    /**
     * Get a typed memory buffer view by dense index (unchecked).
     */
    getViewByIndex(index: number): DescriptorToMemoryBuffer<D> {
        return wrap(this._descriptor, this._buffer, index * this._pitch) as DescriptorToMemoryBuffer<D>;
    }

    /**
     * Remove all data for a destroyed entity. Same as remove().
     */
    destroyEntity(entity: Entity): boolean {
        return this.remove(entity);
    }

    private grow(): void {
        const newCapacity = this._capacity * 2;
        const newBuffer = new ArrayBuffer(this._pitch * newCapacity);
        new Uint8Array(newBuffer).set(new Uint8Array(this._buffer, 0, this._count * this._pitch));
        this._buffer = newBuffer;
        this._capacity = newCapacity;
    }
}

/**
 * Storage for tag components: just a set tracking membership.
 */
class TagStorage {
    private _entities: Set<number> = new Set();

    /** Expose the raw set for iteration in views. */
    get entities(): ReadonlySet<number> {
        return this._entities;
    }

    get count(): number {
        return this._entities.size;
    }

    has(entity: Entity): boolean {
        return this._entities.has(entity as number);
    }

    add(entity: Entity): void {
        this._entities.add(entity as number);
    }

    remove(entity: Entity): boolean {
        return this._entities.delete(entity as number);
    }

    destroyEntity(entity: Entity): boolean {
        return this.remove(entity);
    }
}

// ============================================================================
// Value Writing (dispatch to correct .set() overload)
// ============================================================================

/**
 * Write a DescriptorValueType into a buffer at a given offset.
 * Handles the set() signature differences across memory buffer types.
 */
function writeValue<D extends Descriptor<DescriptorTypedArray>>(
    descriptor: D,
    buffer: ArrayBuffer,
    offset: number,
    value: DescriptorValueType<D>,
): void {
    const wrapped = wrap(descriptor, buffer, offset);

    switch (descriptor.type) {
        case GPU_STRUCT: {
            const buf = wrapped as unknown as StructMemoryBuffer<Record<string, Descriptor<DescriptorTypedArray>>>;
            buf.set(value as unknown as Record<string, unknown> as DescriptorValueType<StructDescriptor<Record<string, Descriptor<DescriptorTypedArray>>>>);
            break;
        }
        case GPU_VEC2:
        case GPU_VEC3:
        case GPU_VEC4: {
            const buf = wrapped as unknown as VecMemoryBuffer<ScalarDescriptor, 2 | 3 | 4>;
            buf.set(value as unknown as [number, number]);
            break;
        }
        case GPU_MAT2:
        case GPU_MAT3:
        case GPU_MAT4: {
            // Matrices expect column-wise set(colIndex, values).
            // DescriptorValueType<MatDescriptor<S,N>> = TupleOf<N, TupleOf<N, number>>
            const buf = wrapped as unknown as MatMemoryBuffer<ScalarDescriptor, 2 | 3 | 4>;
            const cols = value as unknown as number[][];
            for (let i = 0; i < cols.length; i++) {
                buf.set(i as 0, cols[i] as unknown as [number, number]);
            }
            break;
        }
        case GPU_BOOL: {
            const buf = wrapped as unknown as BoolMemoryBuffer;
            buf.set(value as unknown as boolean);
            break;
        }
        default: {
            // Scalar types (i32, u32, f16, f32, f64)
            const buf = wrapped as unknown as ScalarMemoryBuffer<ScalarDescriptor>;
            buf.set(value as unknown as number);
            break;
        }
    }
}

// ============================================================================
// View: Cached Query
// ============================================================================

type AnyStorage = DataStorage<Descriptor<DescriptorTypedArray>> | TagStorage;

/**
 * A View caches the entity intersection for a set of component types.
 * Automatically invalidated when entities gain or lose relevant components.
 */
export class View<Defs extends readonly AnyComponentDef[]> {
    /** The component names this view tracks. */
    private readonly _names: readonly string[];
    /** References to the storages being queried. */
    private readonly _storages: readonly AnyStorage[];
    /** The index into _storages of the smallest storage (drives iteration). */
    private _drivingIndex: number = 0;
    /** Cached entity list. Null when dirty. */
    private _cached: Entity[] | null = null;
    private _isDirty: boolean = true;
    private _world: World<Defs> | null;

    constructor(world: World<Defs>, names: readonly string[], storages: readonly AnyStorage[]) {
        this._world = world;
        this._names = names;
        this._storages = storages;
    }

    get names(): readonly string[] {
        return this._names;
    }

    /** Mark this view as needing recomputation. */
    markDirty(): void {
        this._isDirty = true;
        this._cached = null;
    }

    /** Check whether this view cares about a given component name. */
    caresAbout(componentName: string): boolean {
        return this._names.includes(componentName);
    }

    /** Dispose this view (unregister from world). */
    dispose(): void {
        if (this._world) {
            this._world.destroyView(this);
            this._world = null;
        }
    }

    [Symbol.dispose](): void {
        this.dispose();
    }

    /**
     * Get the list of entities matching all queried components.
     * Computes the intersection lazily using the smallest-set-first strategy.
     */
    getEntities(): readonly Entity[] {
        if (this._isDirty) {
            this._cached = this.computeIntersection();
            this._isDirty = false;
        }
        return this._cached ?? [];
    }

    private computeIntersection(): Entity[] {
        if (this._storages.length === 0) {
            return [];
        }

        // Find the smallest storage to drive iteration.
        let smallestSize = Infinity;
        let smallestIdx = 0;
        for (let i = 0; i < this._storages.length; i++) {
            const size = this._storages[i]!.count;
            if (size < smallestSize) {
                smallestSize = size;
                smallestIdx = i;
            }
        }
        this._drivingIndex = smallestIdx;

        const driver = this._storages[smallestIdx]!;
        const result: Entity[] = [];

        // Collect entities from the driving storage.
        const candidates: Entity[] = [];
        if (driver instanceof DataStorage) {
            for (let i = 0; i < driver.count; i++) {
                candidates.push(driver.dense[i]!);
            }
        } else {
            for (const id of (driver as TagStorage).entities) {
                candidates.push(id as Entity);
            }
        }

        // Check each candidate against all other storages.
        outer:
            for (const entity of candidates) {
                for (let i = 0; i < this._storages.length; i++) {
                    if (i === smallestIdx) {
                        continue;
                    }
                    if (!this._storages[i]!.has(entity)) {
                        continue outer;
                    }
                }
                result.push(entity);
            }

        return result;
    }
}

// ============================================================================
// World
// ============================================================================

export class World<Defs extends readonly AnyComponentDef[]> {
    private _nextEntityId: number = 1;
    private _entities: Set<number> = new Set();
    private _dataStorages: Map<string, DataStorage<Descriptor<DescriptorTypedArray>>> = new Map();
    private _tagStorages: Map<string, TagStorage> = new Map();
    private _views: Set<View<readonly AnyComponentDef[]>> = new Set();
    private readonly _defs: Defs;

    constructor(...defs: Defs) {
        this._defs = defs;
        for (const def of defs) {
            if (def.descriptor !== null) {
                this._dataStorages.set(def.name, new DataStorage(def.descriptor));
            } else {
                this._tagStorages.set(def.name, new TagStorage());
            }
        }
    }

    // ----------------------------------------------------------------
    // Entity lifecycle
    // ----------------------------------------------------------------

    createEntity(): Entity {
        const entity = this._nextEntityId++ as Entity;
        this._entities.add(entity as number);
        return entity;
    }

    destroyEntity(entity: Entity): boolean {
        if (!this._entities.delete(entity as number)) {
            return false;
        }

        // Remove from all storages.
        for (const storage of this._dataStorages.values()) {
            storage.destroyEntity(entity);
        }
        for (const storage of this._tagStorages.values()) {
            storage.destroyEntity(entity);
        }

        // Notify views.
        for (const view of this._views) {
            view.markDirty();
        }

        return true;
    }

    entityExists(entity: Entity): boolean {
        return this._entities.has(entity as number);
    }

    getAllEntities(): Entity[] {
        return Array.from(this._entities) as Entity[];
    }

    // ----------------------------------------------------------------
    // Component management
    // ----------------------------------------------------------------

    /**
     * Add a data component to an entity.
     */
    add<Def extends DataDefsOnly<Defs>>(
        entity: Entity,
        def: Def,
        value: DescriptorValueType<Def["descriptor"]>,
    ): void;
    /**
     * Add a tag component to an entity.
     */
    add<Def extends Extract<Defs[number], TagComponentDef>>(
        entity: Entity,
        def: Def,
    ): void;
    add(entity: Entity, def: AnyComponentDef, value?: unknown): void {
        if (!this._entities.has(entity as number)) {
            throw new Error(`Entity ${entity} does not exist`);
        }

        const name = def.name;
        const hadBefore = this.has(entity, def);

        if (def.descriptor !== null) {
            const storage = this._dataStorages.get(name);
            if (!storage) {
                throw new Error(`Unknown data component: "${name}"`);
            }
            storage.add(entity, value as DescriptorValueType<Descriptor<DescriptorTypedArray>>);
        } else {
            const storage = this._tagStorages.get(name);
            if (!storage) {
                throw new Error(`Unknown tag component: "${name}"`);
            }
            storage.add(entity);
        }

        // Only notify views if this is a new addition (not an overwrite).
        if (!hadBefore) {
            for (const view of this._views) {
                if (view.caresAbout(name)) {
                    view.markDirty();
                }
            }
        }
    }

    /**
     * Check if an entity has a component.
     */
    has(entity: Entity, def: AnyComponentDef): boolean {
        if (def.descriptor !== null) {
            return this._dataStorages.get(def.name)?.has(entity) ?? false;
        }
        return this._tagStorages.get(def.name)?.has(entity) ?? false;
    }

    /**
     * Get a typed memory buffer view for an entity's data component.
     * Returns undefined for tag components or if the entity lacks the component.
     */
    get<Def extends DataDefsOnly<Defs>>(
        entity: Entity,
        def: Def,
    ): DescriptorToMemoryBuffer<Def["descriptor"]> | undefined {
        const storage = this._dataStorages.get(def.name);
        if (!storage) {
            return undefined;
        }
        return storage.getView(entity) as DescriptorToMemoryBuffer<Def["descriptor"]> | undefined;
    }

    /**
     * Remove a component from an entity.
     */
    remove(entity: Entity, def: AnyComponentDef): boolean {
        let removed: boolean;
        if (def.descriptor !== null) {
            removed = this._dataStorages.get(def.name)?.remove(entity) ?? false;
        } else {
            removed = this._tagStorages.get(def.name)?.remove(entity) ?? false;
        }

        if (removed) {
            for (const view of this._views) {
                if (view.caresAbout(def.name)) {
                    view.markDirty();
                }
            }
        }

        return removed;
    }

    // ----------------------------------------------------------------
    // Views & Queries
    // ----------------------------------------------------------------

    /**
     * Create a cached view for efficient repeated queries.
     * Supports `using` for automatic cleanup.
     *
     * ```ts
     * using view = world.createView(Position, Velocity);
     * ```
     */
    createView<Q extends readonly AnyComponentDef[]>(
        ...queryDefs: Q
    ): View<Q> {
        const names: string[] = [];
        const storages: AnyStorage[] = [];

        for (const def of queryDefs) {
            names.push(def.name);
            if (def.descriptor !== null) {
                const s = this._dataStorages.get(def.name);
                if (!s) {
                    throw new Error(`Unknown data component: "${def.name}"`);
                }
                storages.push(s);
            } else {
                const s = this._tagStorages.get(def.name);
                if (!s) {
                    throw new Error(`Unknown tag component: "${def.name}"`);
                }
                storages.push(s);
            }
        }

        const view = new View<Q>(this as unknown as World<Q>, names, storages);

        this._views.add(view as View<readonly AnyComponentDef[]>);
        return view;
    }

    /**
     * Remove a view from the world.
     */
    destroyView(view: View<readonly AnyComponentDef[]>): void {
        this._views.delete(view);
    }

    /**
     * Iterate a view, yielding typed component accessors per entity.
     * Creates fresh DescriptorToMemoryBuffer wrappers per iteration step.
     *
     * ```ts
     * for (const { entity, Position } of world.query(view)) {
     *     const pos = Position.get("pos"); // VecMemoryBuffer
     * }
     * ```
     */
    * query<Q extends readonly AnyComponentDef[]>(
        view: View<Q>,
    ): Generator<ViewResult<Q>> {
        const entities = view.getEntities();
        const names = view.names;

        for (const entity of entities) {
            const result: Record<string, unknown> = {entity};

            for (const name of names) {
                const dataStorage = this._dataStorages.get(name);
                if (dataStorage) {
                    result[name] = dataStorage.getView(entity);
                }
                // Tag components don't contribute to the result object.
            }

            yield result as ViewResult<Q>;
        }
    }

    /**
     * Callback-based iteration over a view. Lower overhead than the
     * generator — reuses a single result object across iterations.
     *
     * **Important:** Do not retain references to the result object or its
     * component buffers across callback invocations; offsets are stable
     * per call but the object identity is reused.
     */
    forEach<Q extends readonly AnyComponentDef[]>(
        view: View<Q>,
        callback: (result: ViewResult<Q>) => void,
    ): void {
        const entities = view.getEntities();
        const names = view.names;

        // Pre-collect data storage references for the queried names.
        const dataStorageEntries: Array<{ name: string; storage: DataStorage<Descriptor<DescriptorTypedArray>> }> = [];
        for (const name of names) {
            const ds = this._dataStorages.get(name);
            if (ds) {
                dataStorageEntries.push({name, storage: ds});
            }
        }

        // Reusable result object.
        const result: Record<string, unknown> = {};

        for (const entity of entities) {
            result["entity"] = entity;

            for (const entry of dataStorageEntries) {
                result[entry.name] = entry.storage.getView(entity);
            }

            callback(result as ViewResult<Q>);
        }
    }

    /**
     * Raw callback iteration for maximum performance.
     * Provides the entity and its byte offset in each data storage's buffer.
     * You can then use typed arrays directly.
     */
    forEachRaw<Q extends readonly AnyComponentDef[]>(
        view: View<Q>,
        callback: (entity: Entity, buffers: RawBufferMap<Q>) => void,
    ): void {
        const entities = view.getEntities();
        const names = view.names;

        // Collect data storages.
        const entries: Array<{
            name: string;
            storage: DataStorage<Descriptor<DescriptorTypedArray>>;
        }> = [];
        for (const name of names) {
            const ds = this._dataStorages.get(name);
            if (ds) {
                entries.push({name, storage: ds});
            }
        }

        const bufferMap: Record<string, { buffer: ArrayBuffer; offset: number; pitch: number }> = {};

        for (const entity of entities) {
            for (const entry of entries) {
                const idx = entry.storage.indexOf(entity);
                bufferMap[entry.name] = {
                    buffer: entry.storage.buffer,
                    offset: idx * entry.storage.pitch,
                    pitch: entry.storage.pitch,
                };
            }
            callback(entity, bufferMap as RawBufferMap<Q>);
        }
    }

    // ----------------------------------------------------------------
    // One-off queries (no view caching)
    // ----------------------------------------------------------------

    /**
     * One-off query without a cached view. Convenient but slower for
     * repeated use — prefer createView + query for hot paths.
     */
    * queryOnce<Q extends readonly AnyComponentDef[]>(
        ...queryDefs: Q
    ): Generator<ViewResult<Q>> {
        // Gather storages.
        const storages: AnyStorage[] = [];
        const names: string[] = [];
        for (const def of queryDefs) {
            names.push(def.name);
            if (def.descriptor !== null) {
                const s = this._dataStorages.get(def.name);
                if (!s) {
                    return;
                }
                storages.push(s);
            } else {
                const s = this._tagStorages.get(def.name);
                if (!s) {
                    return;
                }
                storages.push(s);
            }
        }

        // Find smallest.
        let smallestIdx = 0;
        let smallestSize = Infinity;
        for (let i = 0; i < storages.length; i++) {
            if (storages[i]!.count < smallestSize) {
                smallestSize = storages[i]!.count;
                smallestIdx = i;
            }
        }

        const driver = storages[smallestIdx]!;
        const candidates: Entity[] = [];
        if (driver instanceof DataStorage) {
            for (let i = 0; i < driver.count; i++) {
                candidates.push(driver.dense[i]!);
            }
        } else {
            for (const id of (driver as TagStorage).entities) {
                candidates.push(id as Entity);
            }
        }

        outer:
            for (const entity of candidates) {
                for (let i = 0; i < storages.length; i++) {
                    if (i === smallestIdx) {
                        continue;
                    }
                    if (!storages[i]!.has(entity)) {
                        continue outer;
                    }
                }

                const result: Record<string, unknown> = {entity};
                for (const name of names) {
                    const ds = this._dataStorages.get(name);
                    if (ds) {
                        result[name] = ds.getView(entity);
                    }
                }
                yield result as ViewResult<Q>;
            }
    }
}

// ============================================================================
// Raw Buffer Map Type
// ============================================================================

type RawBufferEntry = {
    buffer: ArrayBuffer;
    offset: number;
    pitch: number;
};

type RawBufferMap<Defs extends readonly AnyComponentDef[]> = {
    [D in DataDefsOnly<Defs> as D["name"]]: RawBufferEntry;
};
