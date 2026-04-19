// ─── Uniforms ───────────────────────────────────────────────────────────────
//
// view_proj:    bound once per pass as a regular uniform buffer
//               SDL3: SDL_BindGPUVertexUniformBuffers(cmd, 0, &binding, 1)
//
// model_matrix: pushed per draw call
//               SDL3: SDL_PushGPUVertexUniformData(cmd, 1, &matrix, 64)
//
// VERIFY: SDL3's WGSL group numbers for uniform buffers before running.
// Commonly @group(1) for push uniforms in SDL3 — check your SDL3 version's docs.

struct Camera {
    view_proj: mat4x4f,
}

struct Model {
    m: mat4x4f,
}

@group(1) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(1) var<uniform> model: Model;

// ─── Vertex stage ────────────────────────────────────────────────────────────

struct VertexInput {
    @location(0) position: vec2f,
    @location(1) color:    vec4f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0)       color:    vec4f,
}

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;

    // Local 2D position → world space via model matrix → clip space via view_proj.
    // Z = 0.0 because all geometry is tessellated flat in local space.
    let world_pos = model.m * vec4f(in.position, 0.0, 1.0);
    out.position  = camera.view_proj * world_pos;
    out.color     = in.color;

    return out;
}

// ─── Fragment stage ──────────────────────────────────────────────────────────

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
    return in.color;
}
