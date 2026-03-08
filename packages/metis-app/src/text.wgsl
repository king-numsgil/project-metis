struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@vertex
fn vs_main(@location(0) xy: vec2f, @location(1) uv: vec2f) -> VertexOutput {
    var out: VertexOutput;
    out.position = vec4f(xy, 0.0, 1.0);
    out.uv = uv;
    return out;
}

@group(2) @binding(0) var atlas: texture_2d<f32>;
@group(2) @binding(1) var samp: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let coverage = textureSample(atlas, samp, uv).a;
    return vec4f(1.0, 1.0, 1.0, coverage);
}
