struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@vertex
fn vs_main(@location(0) position: vec4f, @location(1) color: vec4f) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f(position.xy, 0.0, 1.0);
    output.color = color;
    return output;
}

@fragment
fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f {
    return vec4f(color.rgb, 1.0);
}
