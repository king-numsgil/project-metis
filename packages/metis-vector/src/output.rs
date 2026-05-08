use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Which kind of draw operation produced this call.
/// Backed by a u32 — no marshalling cost across the N-API boundary.
#[napi]
#[derive(Clone, Copy, Debug)]
#[repr(u32)]
pub enum DrawKind {
    Fill           = 0,
    Stroke         = 1,
    PreTessellated = 2, // text rendered via the glyph cache
}

#[napi(object)]
pub struct GpuDrawCall {
    pub id:   u32,
    pub kind: u32, // DrawKind value — napi enums export as numeric constants
    pub first_index: u32,
    pub index_count: u32,
    pub model_matrix: Float32Array,
    /// Paint descriptor — 16 f32s (64 bytes) in std140 layout.
    /// See Paint::to_std140() for the exact field layout.
    pub paint: Float32Array,
}

#[napi(object)]
pub struct FlushOutput {
    pub vertices: Float32Array,
    pub indices: Uint32Array,
    pub draw_calls: Vec<GpuDrawCall>,
}

#[napi(object)]
pub struct FontMetrics {
    pub ascender: f64,
    pub descender: f64,
    pub line_gap: f64,
    pub line_height: f64,
    pub cap_height: f64,
    pub x_height: f64,
    pub units_per_em: f64,
}
