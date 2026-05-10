// ─── Uniforms ───────────────────────────────────────────────────────────────
//
// view_proj:    vertex push uniform slot 0
//               SDL3: cb.pushVertexUniformData(0, ortho.buffer)
//
// model_matrix: vertex push uniform slot 1 (per draw call)
//               SDL3: cb.pushVertexUniformData(1, call.modelMatrix.buffer)
//
// paint:        fragment push uniform slot 0 (per draw call)
//               SDL3: cb.pushFragmentUniformData(0, call.paint.buffer)
//
// SDL3 SPIR-V group mapping:
//   vertex uniforms   → set 1 → @group(1)
//   fragment uniforms → set 3 → @group(3)
//   binding number    = slot_index passed to the Push call

struct Camera {
    view_proj: mat4x4f,
}

struct Model {
    m: mat4x4f,
}

struct Paint {
    color_a:        vec4f,   // flat color, or gradient start color
    color_b:        vec4f,   // gradient end color
    gradient_start: vec2f,   // UV space [0,1]
    gradient_end:   vec2f,   // UV space [0,1]
    mode:           f32,     // 0=flat, 1=linear, 2=radial
    _pad0:          f32,
    _pad1:          f32,
    _pad2:          f32,
}

@group(1) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(1) var<uniform> model: Model;
@group(3) @binding(0) var<uniform> paint: Paint;

// ─── Vertex stage ────────────────────────────────────────────────────────────

struct VertexInput {
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    let world_pos = model.m * vec4f(in.position, 0.0, 1.0);
    out.position = camera.view_proj * world_pos;
    out.uv = in.uv;
    return out;
}

// ─── Fragment stage ──────────────────────────────────────────────────────────

fn linear_gradient(uv: vec2f) -> vec4f {
    let dir = paint.gradient_end - paint.gradient_start;
    let len_sq = dot(dir, dir);
    let t = select(0.0, dot(uv - paint.gradient_start, dir) / len_sq, len_sq > 0.0);
    return mix(paint.color_a, paint.color_b, clamp(t, 0.0, 1.0));
}

fn radial_gradient(uv: vec2f) -> vec4f {
    let radius = length(paint.gradient_end - paint.gradient_start);
    let dist = length(uv - paint.gradient_start);
    let t = select(0.0, dist / radius, radius > 0.0);
    return mix(paint.color_a, paint.color_b, clamp(t, 0.0, 1.0));
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
    if paint.mode == 1.0 {
        return linear_gradient(in.uv);
    } else if paint.mode == 2.0 {
        return radial_gradient(in.uv);
    }
    return paint.color_a;
}
