import { F32, StructOf, U32, Vec } from "metis-data";
import { describe, expect, test } from "bun:test";

import { component, type Entity, tag, World } from "./ecs.ts";

// ============================================================================
// Component Definitions
// ============================================================================

const Position = component("Position", StructOf({
    x: F32,
    y: F32,
    z: F32,
}));

const Velocity = component("Velocity", StructOf({
    vx: F32,
    vy: F32,
    vz: F32,
}));

const Health = component("Health", U32);

const Visible = tag("Visible");
const PlayerControlled = tag("PlayerControlled");

const Transform2D = component("Transform2D", Vec(F32, 2));

// ============================================================================
// Tests
// ============================================================================

describe("Component Definitions", () => {
    test("component() creates a data component def", () => {
        expect(Position.name).toBe("Position");
        expect(Position.descriptor).not.toBeNull();
        expect(Position.__tag).toBe(false);
    });

    test("tag() creates a tag component def", () => {
        expect(Visible.name).toBe("Visible");
        expect(Visible.descriptor).toBeNull();
        expect(Visible.__tag).toBe(true);
    });
});

describe("World - Entity Lifecycle", () => {
    test("createEntity returns unique entities", () => {
        const world = new World(Position, Velocity);
        const a = world.createEntity();
        const b = world.createEntity();
        const c = world.createEntity();
        expect(a).not.toBe(b);
        expect(b).not.toBe(c);
        expect(a).not.toBe(c);
    });

    test("entityExists returns true for live entities", () => {
        const world = new World(Position);
        const e = world.createEntity();
        expect(world.entityExists(e)).toBe(true);
    });

    test("destroyEntity removes entity", () => {
        const world = new World(Position);
        const e = world.createEntity();
        expect(world.destroyEntity(e)).toBe(true);
        expect(world.entityExists(e)).toBe(false);
    });

    test("destroyEntity returns false for nonexistent entity", () => {
        const world = new World(Position);
        expect(world.destroyEntity(999 as Entity)).toBe(false);
    });

    test("getAllEntities returns all live entities", () => {
        const world = new World(Position);
        const a = world.createEntity();
        const b = world.createEntity();
        const c = world.createEntity();
        world.destroyEntity(b);
        const all = world.getAllEntities();
        expect(all).toContain(a);
        expect(all).not.toContain(b);
        expect(all).toContain(c);
        expect(all.length).toBe(2);
    });
});

describe("World - Data Components", () => {
    test("add and get a struct component", () => {
        const world = new World(Position);
        const e = world.createEntity();
        world.add(e, Position, {x: 1, y: 2, z: 3});

        const pos = world.get(e, Position);
        expect(pos).toBeDefined();
        const x = pos!.get("x");
        const y = pos!.get("y");
        const z = pos!.get("z");
        expect(x.get()).toBe(1);
        expect(y.get()).toBe(2);
        expect(z.get()).toBe(3);
    });

    test("add a scalar component", () => {
        const world = new World(Health);
        const e = world.createEntity();
        world.add(e, Health, 100);

        const hp = world.get(e, Health);
        expect(hp).toBeDefined();
        expect(hp!.get()).toBe(100);
    });

    test("add a vec component", () => {
        const world = new World(Transform2D);
        const e = world.createEntity();
        world.add(e, Transform2D, [10, 20]);

        const t = world.get(e, Transform2D);
        expect(t).toBeDefined();
        expect(t!.get()).toEqual([10, 20]);
    });

    test("overwriting a component updates the value", () => {
        const world = new World(Position);
        const e = world.createEntity();
        world.add(e, Position, {x: 1, y: 2, z: 3});
        world.add(e, Position, {x: 10, y: 20, z: 30});

        const pos = world.get(e, Position);
        expect(pos!.get("x").get()).toBe(10);
        expect(pos!.get("y").get()).toBe(20);
        expect(pos!.get("z").get()).toBe(30);
    });

    test("get returns undefined for missing component", () => {
        const world = new World(Position, Velocity);
        const e = world.createEntity();
        world.add(e, Position, {x: 1, y: 2, z: 3});

        expect(world.get(e, Velocity)).toBeUndefined();
    });

    test("has returns correct values", () => {
        const world = new World(Position, Velocity);
        const e = world.createEntity();
        world.add(e, Position, {x: 1, y: 2, z: 3});

        expect(world.has(e, Position)).toBe(true);
        expect(world.has(e, Velocity)).toBe(false);
    });

    test("remove a data component", () => {
        const world = new World(Position);
        const e = world.createEntity();
        world.add(e, Position, {x: 1, y: 2, z: 3});
        expect(world.remove(e, Position)).toBe(true);
        expect(world.has(e, Position)).toBe(false);
        expect(world.get(e, Position)).toBeUndefined();
    });

    test("remove returns false if component not present", () => {
        const world = new World(Position);
        const e = world.createEntity();
        expect(world.remove(e, Position)).toBe(false);
    });

    test("add throws for nonexistent entity", () => {
        const world = new World(Position);
        expect(() => {
            world.add(999 as Entity, Position, {x: 0, y: 0, z: 0});
        }).toThrow();
    });
});

describe("World - Tag Components", () => {
    test("add and check a tag", () => {
        const world = new World(Visible);
        const e = world.createEntity();
        world.add(e, Visible);

        expect(world.has(e, Visible)).toBe(true);
    });

    test("remove a tag", () => {
        const world = new World(Visible);
        const e = world.createEntity();
        world.add(e, Visible);
        expect(world.remove(e, Visible)).toBe(true);
        expect(world.has(e, Visible)).toBe(false);
    });
});

describe("World - destroyEntity cleans up components", () => {
    test("destroying entity removes its data components", () => {
        const world = new World(Position, Velocity);
        const e = world.createEntity();
        world.add(e, Position, {x: 1, y: 2, z: 3});
        world.add(e, Velocity, {vx: 4, vy: 5, vz: 6});
        world.destroyEntity(e);

        // Can't get components from a destroyed entity
        expect(world.get(e, Position)).toBeUndefined();
        expect(world.get(e, Velocity)).toBeUndefined();
    });
});

describe("Views & Queries", () => {
    test("createView and query entities with all components", () => {
        const world = new World(Position, Velocity, Visible);
        const a = world.createEntity();
        world.add(a, Position, {x: 1, y: 0, z: 0});
        world.add(a, Velocity, {vx: 10, vy: 0, vz: 0});

        const b = world.createEntity();
        world.add(b, Position, {x: 2, y: 0, z: 0});
        // b has no Velocity

        const c = world.createEntity();
        world.add(c, Position, {x: 3, y: 0, z: 0});
        world.add(c, Velocity, {vx: 30, vy: 0, vz: 0});

        using view = world.createView(Position, Velocity);
        const results: Entity[] = [];
        for (const {entity, Position: pos} of world.query(view)) {
            results.push(entity);
            expect(pos).toBeDefined();
        }

        expect(results.length).toBe(2);
        expect(results).toContain(a);
        expect(results).toContain(c);
        expect(results).not.toContain(b);
    });

    test("query with tag filter", () => {
        const world = new World(Position, Visible);
        const a = world.createEntity();
        world.add(a, Position, {x: 1, y: 2, z: 3});
        world.add(a, Visible);

        const b = world.createEntity();
        world.add(b, Position, {x: 4, y: 5, z: 6});
        // b is not visible

        using view = world.createView(Position, Visible);
        const results = [...world.query(view)];
        expect(results.length).toBe(1);
        expect(results[0]!.entity).toBe(a);
    });

    test("view invalidated on component add", () => {
        const world = new World(Position, Velocity);
        const a = world.createEntity();
        world.add(a, Position, {x: 0, y: 0, z: 0});

        using view = world.createView(Position, Velocity);

        // Initially a doesn't have Velocity
        expect([...world.query(view)].length).toBe(0);

        // Add Velocity to a
        world.add(a, Velocity, {vx: 1, vy: 0, vz: 0});
        expect([...world.query(view)].length).toBe(1);
    });

    test("view invalidated on component remove", () => {
        const world = new World(Position, Velocity);
        const a = world.createEntity();
        world.add(a, Position, {x: 0, y: 0, z: 0});
        world.add(a, Velocity, {vx: 1, vy: 0, vz: 0});

        using view = world.createView(Position, Velocity);
        expect([...world.query(view)].length).toBe(1);

        world.remove(a, Velocity);
        expect([...world.query(view)].length).toBe(0);
    });

    test("view invalidated on entity destroy", () => {
        const world = new World(Position);
        const a = world.createEntity();
        world.add(a, Position, {x: 0, y: 0, z: 0});

        using view = world.createView(Position);
        expect([...world.query(view)].length).toBe(1);

        world.destroyEntity(a);
        expect([...world.query(view)].length).toBe(0);
    });

    test("view dispose removes it from world", () => {
        const world = new World(Position);
        const view = world.createView(Position);
        view.dispose();
        // No error — just works. View is detached.
        expect(view.getEntities().length).toBe(0);
    });

    test("using statement disposes view", () => {
        const world = new World(Position);
        const e = world.createEntity();
        world.add(e, Position, {x: 1, y: 2, z: 3});

        let viewRef: ReturnType<typeof world.createView>;
        {
            using view = world.createView(Position);
            viewRef = view;
            expect([...world.query(view)].length).toBe(1);
        }
        // After scope exit, view is disposed.
        // It should still function but be detached from world updates.
    });
});

describe("forEach (callback iteration)", () => {
    test("forEach iterates matching entities", () => {
        const world = new World(Position, Health);
        const a = world.createEntity();
        world.add(a, Position, {x: 1, y: 0, z: 0});
        world.add(a, Health, 100);

        const b = world.createEntity();
        world.add(b, Position, {x: 2, y: 0, z: 0});
        world.add(b, Health, 50);

        const c = world.createEntity();
        world.add(c, Position, {x: 3, y: 0, z: 0});
        // No Health

        using view = world.createView(Position, Health);
        const entities: Entity[] = [];
        world.forEach(view, (result) => {
            entities.push(result.entity);
        });

        expect(entities.length).toBe(2);
        expect(entities).toContain(a);
        expect(entities).toContain(b);
    });
});

describe("queryOnce (one-off queries)", () => {
    test("queryOnce works without a cached view", () => {
        const world = new World(Position, Visible);
        const a = world.createEntity();
        world.add(a, Position, {x: 5, y: 6, z: 7});
        world.add(a, Visible);

        const b = world.createEntity();
        world.add(b, Position, {x: 8, y: 9, z: 10});

        const results = [...world.queryOnce(Position, Visible)];
        expect(results.length).toBe(1);
        expect(results[0]!.entity).toBe(a);
    });
});

describe("Swap-and-pop correctness", () => {
    test("removing an entity doesn't corrupt other entities' data", () => {
        const world = new World(Health);
        const a = world.createEntity();
        const b = world.createEntity();
        const c = world.createEntity();
        world.add(a, Health, 10);
        world.add(b, Health, 20);
        world.add(c, Health, 30);

        // Remove b (middle) - should swap c into b's slot
        world.remove(b, Health);

        // a and c should still have correct values
        expect(world.get(a, Health)!.get()).toBe(10);
        expect(world.get(c, Health)!.get()).toBe(30);
        expect(world.has(b, Health)).toBe(false);
    });

    test("removing first entity preserves remaining data", () => {
        const world = new World(Health);
        const a = world.createEntity();
        const b = world.createEntity();
        const c = world.createEntity();
        world.add(a, Health, 100);
        world.add(b, Health, 200);
        world.add(c, Health, 300);

        world.remove(a, Health);

        expect(world.get(b, Health)!.get()).toBe(200);
        expect(world.get(c, Health)!.get()).toBe(300);
    });

    test("removing last entity is clean", () => {
        const world = new World(Health);
        const a = world.createEntity();
        const b = world.createEntity();
        world.add(a, Health, 100);
        world.add(b, Health, 200);

        world.remove(b, Health);

        expect(world.get(a, Health)!.get()).toBe(100);
        expect(world.has(b, Health)).toBe(false);
    });
});

describe("Storage growth", () => {
    test("handles more entities than initial capacity", () => {
        const world = new World(Health);
        const entities: Entity[] = [];

        for (let i = 0; i < 200; i++) {
            const e = world.createEntity();
            world.add(e, Health, i);
            entities.push(e);
        }

        // Verify all values are correct after growth
        for (let i = 0; i < 200; i++) {
            const hp = world.get(entities[i]!, Health);
            expect(hp).toBeDefined();
            expect(hp!.get()).toBe(i);
        }
    });
});

describe("In-place mutation", () => {
    test("mutating a component buffer is reflected on next get", () => {
        const world = new World(Position);
        const e = world.createEntity();
        world.add(e, Position, {x: 0, y: 0, z: 0});

        // Mutate via the buffer directly
        const pos = world.get(e, Position)!;
        pos.get("x").set(42);

        // Getting again should see the mutation
        const pos2 = world.get(e, Position)!;
        expect(pos2.get("x").get()).toBe(42);
    });

    test("multiple entities have independent buffers at different offsets", () => {
        const world = new World(Position);
        const a = world.createEntity();
        const b = world.createEntity();
        world.add(a, Position, {x: 1, y: 2, z: 3});
        world.add(b, Position, {x: 10, y: 20, z: 30});

        // They share the same ArrayBuffer but at different offsets
        const posA = world.get(a, Position)!;
        const posB = world.get(b, Position)!;

        expect(posA.buffer).toBe(posB.buffer);
        expect(posA.get("x").get()).toBe(1);
        expect(posB.get("x").get()).toBe(10);

        // Mutating one doesn't affect the other
        posA.get("x").set(999);
        expect(posA.get("x").get()).toBe(999);
        expect(posB.get("x").get()).toBe(10);
    });
});

describe("Integration: simulate a game loop tick", () => {
    test("position += velocity * dt", () => {
        const world = new World(Position, Velocity);

        const entities: Entity[] = [];
        for (let i = 0; i < 10; i++) {
            const e = world.createEntity();
            world.add(e, Position, {x: i, y: 0, z: 0});
            world.add(e, Velocity, {vx: i * 10, vy: 0, vz: 0});
            entities.push(e);
        }

        const dt = 1 / 60;

        using view = world.createView(Position, Velocity);

        // Simulate one tick
        world.forEach(view, ({Position: pos, Velocity: vel}) => {
            const px = pos.get("x");
            const vx = vel.get("vx");
            px.set(px.get() + vx.get() * dt);
        });

        // Check entity 5: started at x=5, velocity vx=50
        // Expected: 5 + 50 * (1/60) ≈ 5.833...
        const pos5 = world.get(entities[5]!, Position)!;
        expect(pos5.get("x").get()).toBeCloseTo(5 + 50 / 60);
    });
});

describe("forEachRaw", () => {
    test("provides raw buffer access", () => {
        const world = new World(Health);
        const a = world.createEntity();
        const b = world.createEntity();
        world.add(a, Health, 100);
        world.add(b, Health, 200);

        using view = world.createView(Health);
        const values: number[] = [];
        world.forEachRaw(view, (_entity, buffers) => {
            const u32 = new Uint32Array(buffers.Health.buffer, buffers.Health.offset, 1);
            values.push(u32[0]!);
        });

        expect(values).toContain(100);
        expect(values).toContain(200);
        expect(values.length).toBe(2);
    });
});
