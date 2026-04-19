use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi(object)]
pub struct GpuDrawCall {
    pub first_index: u32,
    pub index_count: u32,
    pub model_matrix: Vec<f64>,
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
