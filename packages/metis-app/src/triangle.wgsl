struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@group(3) @binding(0) var<uniform> quad_color: vec4<f32>;

@vertex
fn vs_main(@location(0) position: vec2f, @location(1) uv: vec2f) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f(position, 0.0, 1.0);
    output.uv = uv;
    return output;
}

@group(2) @binding(0) var tex: texture_2d<f32>;
@group(2) @binding(1) var samp: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    return textureSample(tex, samp, uv);
}

@group(1) @binding(0) var output_tex: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(output_tex);

    // Bounds check
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    // Calculate normalized coordinates (0.0 to 1.0)
    let uv = vec2<f32>(f32(global_id.x) / f32(dims.x), f32(global_id.y) / f32(dims.y));

    // Generate gradient color
    // Red increases left to right
    // Green increases top to bottom
    // Blue is constant at 0.5
    let color = vec4<f32>(uv.x, uv.y, 0.5, 1.0);

    // Write to texture
    textureStore(output_tex, vec2<i32>(global_id.xy), color);
}
