import { F32, StructOf, U32, Vec } from "metis-data";
import { component, tag, type View, World } from "./ecs.ts";

// ============================================================================
// Component Definitions
// ============================================================================

const Position = component("Position", StructOf({
    x: F32,
    y: F32,
    z: F32,
}));

const Transform = component("Transform", StructOf({
    px: F32,
    py: F32,
    pz: F32,
}));
const Velocity = component("Velocity", StructOf({
    vx: F32,
    vy: F32,
    vz: F32,
}));
const Health = component("Health", U32);
const Color = component("Color", Vec(F32, 4));
const Active = tag("Active");

type SimpleWorld = World<readonly [typeof Position]>;
type ChunkyWorld = World<readonly [typeof Transform, typeof Velocity, typeof Health, typeof Color, typeof Active]>;
type ChunkyViewDefs = readonly [typeof Transform, typeof Velocity, typeof Health, typeof Color, typeof Active];

// ============================================================================
// Harness
// ============================================================================

interface BenchResult {
    name: string;
    entityCount: number;
    iterations: number;
    avgMs: number;
    medianMs: number;
    minMs: number;
    maxMs: number;
    opsPerSec: number;
}

function bench(
    name: string,
    entityCount: number,
    iterations: number,
    setup: () => void,
    fn: () => void,
    teardown?: () => void,
): BenchResult {
    const samples: number[] = [];

    for (let i = 0; i < Math.min(5, iterations); i++) {
        setup();
        fn();
        teardown?.();
    }

    for (let i = 0; i < iterations; i++) {
        setup();
        const t0 = performance.now();
        fn();
        samples.push(performance.now() - t0);
        teardown?.();
    }

    samples.sort((a, b) => a - b);
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    return {
        name,
        entityCount,
        iterations,
        avgMs: avg,
        medianMs: samples[Math.floor(samples.length / 2)]!,
        minMs: samples[0]!,
        maxMs: samples[samples.length - 1]!,
        opsPerSec: 1000 / avg,
    };
}

// ============================================================================
// Suites
// ============================================================================

const COUNTS = [5, 200, 1000];
const ITERS = 500;

// --- Creation ---

function simpleCreate(n: number): BenchResult {
    let w: SimpleWorld;
    return bench("simple: batch create", n, ITERS,
        () => {
            w = new World(Position);
        },
        () => {
            for (let i = 0; i < n; i++) {
                const e = w.createEntity();
                w.add(e, Position, {x: i, y: i * 2, z: i * 3});
            }
        },
    );
}

function chunkyCreate(n: number): BenchResult {
    let w: ChunkyWorld;
    return bench("chunky: batch create", n, ITERS,
        () => {
            w = new World(Transform, Velocity, Health, Color, Active);
        },
        () => {
            for (let i = 0; i < n; i++) {
                const e = w.createEntity();
                w.add(e, Transform, {px: i, py: i * 2, pz: i * 3});
                w.add(e, Velocity, {vx: 1, vy: 0, vz: 0});
                w.add(e, Health, i * 10);
                w.add(e, Color, [1, 0, 0, 1]);
                w.add(e, Active);
            }
        },
    );
}

// --- Simple updates ---

function simpleUpdateGen(n: number): BenchResult {
    let w: SimpleWorld;
    let v: View<readonly [typeof Position]>;
    return bench("simple: update (generator)", n, ITERS,
        () => {
            w = new World(Position);
            for (let i = 0; i < n; i++) {
                const e = w.createEntity();
                w.add(e, Position, {x: i, y: 0, z: 0});
            }
            v = w.createView(Position);
        },
        () => {
            for (const {Position: pos} of w.query(v)) {
                const x = pos.get("x");
                x.set(x.get() + 1);
            }
        },
        () => {
            v.dispose();
        },
    );
}

function simpleUpdateForEach(n: number): BenchResult {
    let w: SimpleWorld;
    let v: View<readonly [typeof Position]>;
    return bench("simple: update (forEach)", n, ITERS,
        () => {
            w = new World(Position);
            for (let i = 0; i < n; i++) {
                const e = w.createEntity();
                w.add(e, Position, {x: i, y: 0, z: 0});
            }
            v = w.createView(Position);
        },
        () => {
            w.forEach(v, ({Position: pos}) => {
                const x = pos.get("x");
                x.set(x.get() + 1);
            });
        },
        () => {
            v.dispose();
        },
    );
}

function simpleUpdateRaw(n: number): BenchResult {
    let w: SimpleWorld;
    let v: View<readonly [typeof Position]>;
    return bench("simple: update (forEachRaw)", n, ITERS,
        () => {
            w = new World(Position);
            for (let i = 0; i < n; i++) {
                const e = w.createEntity();
                w.add(e, Position, {x: i, y: 0, z: 0});
            }
            v = w.createView(Position);
        },
        () => {
            w.forEachRaw(v, (_e, bufs) => {
                const f32 = new Float32Array(bufs.Position.buffer, bufs.Position.offset, 3);
                f32[0]! += 1;
            });
        },
        () => {
            v.dispose();
        },
    );
}

// --- Chunky updates ---

function makeChunky(n: number): { w: ChunkyWorld; v: View<ChunkyViewDefs> } {
    const w = new World(Transform, Velocity, Health, Color, Active);
    for (let i = 0; i < n; i++) {
        const e = w.createEntity();
        w.add(e, Transform, {px: i, py: 0, pz: 0});
        w.add(e, Velocity, {vx: 1, vy: 0.5, vz: 0});
        w.add(e, Health, 100);
        w.add(e, Color, [1, 1, 1, 1]);
        w.add(e, Active);
    }
    const v = w.createView(Transform, Velocity, Health, Color, Active);
    return {w, v};
}

function chunkyUpdateGen(n: number): BenchResult {
    let w: ChunkyWorld;
    let v: View<ChunkyViewDefs>;
    return bench("chunky: update (generator)", n, ITERS,
        () => {
            const ctx = makeChunky(n);
            w = ctx.w;
            v = ctx.v;
        },
        () => {
            const dt = 1 / 60;
            for (const {Transform: t, Velocity: vel, Health: hp} of w.query(v)) {
                const px = t.get("px");
                const py = t.get("py");
                const pz = t.get("pz");
                const vx = vel.get("vx");
                const vy = vel.get("vy");
                const vz = vel.get("vz");
                px.set(px.get() + vx.get() * dt);
                py.set(py.get() + vy.get() * dt);
                pz.set(pz.get() + vz.get() * dt);
                const h = hp.get();
                if (h > 0) {
                    hp.set(h - 1);
                }
            }
        },
        () => {
            v.dispose();
        },
    );
}

function chunkyUpdateForEach(n: number): BenchResult {
    let w: ChunkyWorld;
    let v: View<ChunkyViewDefs>;
    return bench("chunky: update (forEach)", n, ITERS,
        () => {
            const ctx = makeChunky(n);
            w = ctx.w;
            v = ctx.v;
        },
        () => {
            const dt = 1 / 60;
            w.forEach(v, ({Transform: t, Velocity: vel, Health: hp}) => {
                const px = t.get("px");
                const py = t.get("py");
                const pz = t.get("pz");
                const vx = vel.get("vx");
                const vy = vel.get("vy");
                const vz = vel.get("vz");
                px.set(px.get() + vx.get() * dt);
                py.set(py.get() + vy.get() * dt);
                pz.set(pz.get() + vz.get() * dt);
                const h = hp.get();
                if (h > 0) {
                    hp.set(h - 1);
                }
            });
        },
        () => {
            v.dispose();
        },
    );
}

function chunkyUpdateRaw(n: number): BenchResult {
    let w: ChunkyWorld;
    let v: View<ChunkyViewDefs>;
    return bench("chunky: update (forEachRaw)", n, ITERS,
        () => {
            const ctx = makeChunky(n);
            w = ctx.w;
            v = ctx.v;
        },
        () => {
            const dt = 1 / 60;
            w.forEachRaw(v, (_e, bufs) => {
                const tF32 = new Float32Array(bufs.Transform.buffer, bufs.Transform.offset, 3);
                const vF32 = new Float32Array(bufs.Velocity.buffer, bufs.Velocity.offset, 3);
                const hU32 = new Uint32Array(bufs.Health.buffer, bufs.Health.offset, 1);
                tF32[0]! += vF32[0]! * dt;
                tF32[1]! += vF32[1]! * dt;
                tF32[2]! += vF32[2]! * dt;
                if (hU32[0]! > 0) {
                    hU32[0]!--;
                }
            });
        },
        () => {
            v.dispose();
        },
    );
}

// --- Read-only loops ---

function simpleReadLoop(n: number): BenchResult {
    let w: SimpleWorld;
    let v: View<readonly [typeof Position]>;
    let sum = 0;
    return bench("simple: read-only loop", n, ITERS,
        () => {
            w = new World(Position);
            for (let i = 0; i < n; i++) {
                const e = w.createEntity();
                w.add(e, Position, {x: i, y: i * 2, z: i * 3});
            }
            v = w.createView(Position);
            sum = 0;
        },
        () => {
            w.forEach(v, ({Position: pos}) => {
                sum += pos.get("x").get();
            });
        },
        () => {
            v.dispose();
        },
    );
}

function chunkyReadLoop(n: number): BenchResult {
    let w: ChunkyWorld;
    let v: View<ChunkyViewDefs>;
    let sum = 0;
    return bench("chunky: read-only loop", n, ITERS,
        () => {
            const ctx = makeChunky(n);
            w = ctx.w;
            v = ctx.v;
            sum = 0;
        },
        () => {
            w.forEach(v, ({Transform: t, Health: hp}) => {
                sum += t.get("px").get() + hp.get();
            });
        },
        () => {
            v.dispose();
        },
    );
}

// ============================================================================
// Output
// ============================================================================

function fmtTable(results: BenchResult[]): string {
    const hdr = ["Benchmark", "N", "Avg (ms)", "Median", "Min", "Max", "Ops/s"];
    const rows = results.map((r) => [
        r.name, String(r.entityCount),
        r.avgMs.toFixed(4), r.medianMs.toFixed(4),
        r.minMs.toFixed(4), r.maxMs.toFixed(4),
        r.opsPerSec.toFixed(0),
    ]);
    const W = hdr.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
    const aligns: ("l" | "r")[] = ["l", "r", "r", "r", "r", "r", "r"];
    const pad = (s: string, w: number, a: "l" | "r") => a === "l" ? s.padEnd(w) : s.padStart(w);
    const row = (cells: string[]) => cells.map((c, i) => " " + pad(c, W[i]!, aligns[i]!) + " ").join("|");
    const sep = W.map((w) => "-".repeat(w + 2)).join("+");

    const lines = [row(hdr), sep];
    let prev = "";
    for (const r of rows) {
        const cur = r[0]!.split(":")[0]!;
        if (prev && prev !== cur) {
            lines.push(sep);
        }
        prev = cur;
        lines.push(row(r));
    }
    return lines.join("\n");
}

// ============================================================================
// Main
// ============================================================================

console.log("╔══════════════════════════════════════════╗");
console.log("║         metis-ecs Benchmark Suite        ║");
console.log("╚══════════════════════════════════════════╝");
console.log();
console.log(`  Iterations: ${ITERS}    Entity counts: ${COUNTS.join(", ")}`);
console.log();

const all: BenchResult[] = [];

for (const n of COUNTS) {
    process.stdout.write(`  Running N=${n}...`);
    all.push(simpleCreate(n));
    all.push(chunkyCreate(n));
    all.push(simpleUpdateGen(n));
    all.push(simpleUpdateForEach(n));
    all.push(simpleUpdateRaw(n));
    all.push(chunkyUpdateGen(n));
    all.push(chunkyUpdateForEach(n));
    all.push(chunkyUpdateRaw(n));
    all.push(simpleReadLoop(n));
    all.push(chunkyReadLoop(n));
    console.log(" done");
}

console.log();
console.log(fmtTable(all));

console.log();
console.log("── Iteration Method Comparison (N=1000) ──");
const at1k = all.filter((r) => r.entityCount === 1000);
const groups = new Map<string, BenchResult[]>();
for (const r of at1k) {
    const key = r.name.split(":")[0]!.trim();
    if (!groups.has(key)) {
        groups.set(key, []);
    }
    groups.get(key)!.push(r);
}
for (const [prefix, results] of groups) {
    console.log(`\n  ${prefix}:`);
    for (const r of results) {
        const label = r.name.split(": ").slice(1).join(": ");
        const bar = "█".repeat(Math.max(1, Math.round(r.avgMs * 50)));
        console.log(`    ${label.padEnd(28)} ${r.avgMs.toFixed(4)} ms  ${bar}`);
    }
}
console.log();
