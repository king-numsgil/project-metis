#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

mod commands;
mod font;
mod output;
mod tessellator;

use std::f32::consts::PI;

use lyon_path::math::point;
use lyon_path::geom::euclid::default::Transform2D;
use lyon_path::Path;
use lyon_tessellation::{FillTessellator, StrokeTessellator};
use napi::bindgen_prelude::*;
use napi_derive::napi;

use commands::{FillRule, PaintCommand};
use font::FontStore;
use output::{FlushOutput, FontMetrics, GpuDrawCall};
use tessellator::tessellate_command;

// ---------------------------------------------------------------------------
// Pending draw entry
// ---------------------------------------------------------------------------

struct PendingDraw {
    command: PaintCommand,
    world_transform: [f32; 16],
}

// ---------------------------------------------------------------------------
// Main context object
// ---------------------------------------------------------------------------

#[napi]
pub struct VectorContext {
    // Path builder state
    path_builder: Option<lyon_path::path::Builder>,
    current_path: Option<Path>,
    path_is_from_text: bool,
    text_fill_rule: FillRule,

    // Transform stacks
    local_stack: Vec<Transform2D<f32>>,
    world_transform: [f32; 16],

    // Queued draw commands
    pending: Vec<PendingDraw>,

    // Font storage
    fonts: FontStore,

    // Reused tessellators — their internal scratch allocations survive across calls
    fill_tess: FillTessellator,
    stroke_tess: StrokeTessellator,

    // Tessellation tolerance
    tolerance: f32,
}

fn identity_4x4() -> [f32; 16] {
    [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]
}

fn current_local(stack: &[Transform2D<f32>]) -> Transform2D<f32> {
    stack.last().copied().unwrap_or_else(Transform2D::identity)
}

#[napi]
impl VectorContext {
    #[napi(constructor)]
    pub fn new(tolerance: Option<f64>) -> Self {
        VectorContext {
            path_builder: None,
            current_path: None,
            path_is_from_text: false,
            text_fill_rule: FillRule::NonZero,
            local_stack: Vec::new(),
            world_transform: identity_4x4(),
            pending: Vec::new(),
            fonts: FontStore::new(),
            fill_tess: FillTessellator::new(),
            stroke_tess: StrokeTessellator::new(),
            tolerance: tolerance.map(|t| t as f32).unwrap_or(0.25),
        }
    }

    // -----------------------------------------------------------------------
    // Transform API
    // -----------------------------------------------------------------------

    #[napi]
    pub fn push_transform(&mut self, matrix: Float32Array) {
        let m = matrix.as_ref();
        let t = Transform2D::new(
            m.get(0).copied().unwrap_or(1.0),
            m.get(1).copied().unwrap_or(0.0),
            m.get(2).copied().unwrap_or(0.0),
            m.get(3).copied().unwrap_or(1.0),
            m.get(4).copied().unwrap_or(0.0),
            m.get(5).copied().unwrap_or(0.0),
        );
        let combined = current_local(&self.local_stack).then(&t);
        self.local_stack.push(combined);
    }

    #[napi]
    pub fn pop_transform(&mut self) {
        if !self.local_stack.is_empty() {
            self.local_stack.pop();
        }
    }

    #[napi]
    pub fn set_world_transform(&mut self, matrix: Float32Array) {
        let mut wt = identity_4x4();
        for (i, v) in matrix.as_ref().iter().enumerate().take(16) {
            wt[i] = *v;
        }
        self.world_transform = wt;
    }

    // -----------------------------------------------------------------------
    // Path construction
    // -----------------------------------------------------------------------

    #[napi]
    pub fn begin_path(&mut self) {
        self.path_builder = Some(Path::builder());
        self.current_path = None;
        self.path_is_from_text = false;
        self.text_fill_rule = FillRule::NonZero;
    }

    #[napi]
    pub fn move_to(&mut self, x: f64, y: f64) {
        let lt = current_local(&self.local_stack);
        let p = lt.transform_point(point(x as f32, y as f32));
        if let Some(b) = &mut self.path_builder {
            b.begin(p);
        }
    }

    #[napi]
    pub fn line_to(&mut self, x: f64, y: f64) {
        let lt = current_local(&self.local_stack);
        let p = lt.transform_point(point(x as f32, y as f32));
        if let Some(b) = &mut self.path_builder {
            b.line_to(p);
        }
    }

    #[napi]
    pub fn quad_to(&mut self, cx: f64, cy: f64, x: f64, y: f64) {
        let lt = current_local(&self.local_stack);
        let ctrl = lt.transform_point(point(cx as f32, cy as f32));
        let end = lt.transform_point(point(x as f32, y as f32));
        if let Some(b) = &mut self.path_builder {
            b.quadratic_bezier_to(ctrl, end);
        }
    }

    #[napi]
    pub fn cubic_to(&mut self, c1x: f64, c1y: f64, c2x: f64, c2y: f64, x: f64, y: f64) {
        let lt = current_local(&self.local_stack);
        let c1 = lt.transform_point(point(c1x as f32, c1y as f32));
        let c2 = lt.transform_point(point(c2x as f32, c2y as f32));
        let end = lt.transform_point(point(x as f32, y as f32));
        if let Some(b) = &mut self.path_builder {
            b.cubic_bezier_to(c1, c2, end);
        }
    }

    #[napi]
    pub fn arc(&mut self, cx: f64, cy: f64, radius: f64, start_angle: f64, sweep_angle: f64) {
        let lt = current_local(&self.local_stack);
        let cx = cx as f32;
        let cy = cy as f32;
        let r = radius as f32;
        let start = start_angle as f32;
        let sweep = sweep_angle as f32;

        let steps = ((sweep.abs() / (2.0 * PI)) * 64.0).ceil().max(4.0) as usize;
        let step_angle = sweep / steps as f32;

        let first = lt.transform_point(point(cx + r * start.cos(), cy + r * start.sin()));

        let builder = match &mut self.path_builder {
            Some(b) => b,
            None => return,
        };

        builder.begin(first);
        for i in 1..=steps {
            let angle = start + step_angle * i as f32;
            let p = lt.transform_point(point(cx + r * angle.cos(), cy + r * angle.sin()));
            builder.line_to(p);
        }
    }

    #[napi]
    pub fn close_path(&mut self) {
        if let Some(b) = &mut self.path_builder {
            b.close();
        }
    }

    // -----------------------------------------------------------------------
    // Paint operations
    // -----------------------------------------------------------------------

    fn take_path(&mut self) -> Option<Path> {
        if let Some(builder) = self.path_builder.take() {
            let path = builder.build();
            self.current_path = Some(path.clone());
            Some(path)
        } else {
            self.current_path.clone()
        }
    }

    #[napi]
    pub fn fill(&mut self, r: f64, g: f64, b: f64, a: f64) {
        let path = match self.take_path() {
            Some(p) => p,
            None => return,
        };
        let fill_rule = if self.path_is_from_text {
            self.text_fill_rule.clone()
        } else {
            FillRule::NonZero
        };
        self.pending.push(PendingDraw {
            command: PaintCommand::Fill {
                path,
                color: [r as f32, g as f32, b as f32, a as f32],
                fill_rule,
            },
            world_transform: self.world_transform,
        });
    }

    #[napi]
    pub fn stroke(&mut self, r: f64, g: f64, b: f64, a: f64, width: f64) {
        let path = match self.take_path() {
            Some(p) => p,
            None => return,
        };
        self.pending.push(PendingDraw {
            command: PaintCommand::Stroke {
                path,
                color: [r as f32, g as f32, b as f32, a as f32],
                width: width as f32,
            },
            world_transform: self.world_transform,
        });
    }

    // -----------------------------------------------------------------------
    // Font API
    // -----------------------------------------------------------------------

    #[napi]
    pub fn load_font(
        &mut self,
        name: String,
        path: String,
        face_index: Option<u32>,
    ) -> napi::Result<()> {
        self.fonts
            .load(name, &path, face_index.unwrap_or(0))
            .map_err(napi::Error::from_reason)
    }

    #[napi]
    pub fn unload_font(&mut self, name: String) {
        self.fonts.unload(&name);
    }

    #[napi]
    pub fn draw_text(
        &mut self,
        text: String,
        font_name: String,
        size_px: f64,
        x: f64,
        y: f64,
    ) -> napi::Result<()> {
        if text.contains('\n') || text.contains('\r') {
            return Err(napi::Error::from_reason(
                "draw_text is single-line only; text layout (line breaks) must be done in the caller",
            ));
        }

        let lt = current_local(&self.local_stack);
        let mut builder = Path::builder();

        let fill_rule = font::expand_text_path(
            &self.fonts,
            &font_name,
            size_px as f32,
            &text,
            x as f32,
            y as f32,
            &lt,
            &mut builder,
        )
        .map_err(napi::Error::from_reason)?;

        self.current_path = Some(builder.build());
        self.path_builder = None;
        self.path_is_from_text = true;
        self.text_fill_rule = fill_rule;

        Ok(())
    }

    #[napi]
    pub fn font_metrics(&self, font_name: String, size_px: f64) -> napi::Result<FontMetrics> {
        let (ascender, descender, line_gap, line_height, cap_height, x_height, upm) =
            font::get_font_metrics(&self.fonts, &font_name, size_px as f32)
                .map_err(napi::Error::from_reason)?;

        Ok(FontMetrics {
            ascender:     ascender as f64,
            descender:    descender as f64,
            line_gap:     line_gap as f64,
            line_height:  line_height as f64,
            cap_height:   cap_height as f64,
            x_height:     x_height as f64,
            units_per_em: upm as f64,
        })
    }

    #[napi]
    pub fn measure_text(&self, font_name: String, size_px: f64, text: String) -> napi::Result<f64> {
        if text.contains('\n') || text.contains('\r') {
            return Err(napi::Error::from_reason(
                "measure_text is single-line only; text layout (line breaks) must be done in the caller",
            ));
        }
        font::measure_text_width(&self.fonts, &font_name, size_px as f32, &text)
            .map(|w| w as f64)
            .map_err(napi::Error::from_reason)
    }

    // -----------------------------------------------------------------------
    // Flush / clear
    // -----------------------------------------------------------------------

    #[napi]
    pub fn flush(&mut self) -> napi::Result<FlushOutput> {
        let pending = std::mem::take(&mut self.pending);
        self.current_path = None;
        self.path_builder = None;

        let mut all_vertices: Vec<f32> = Vec::new();
        let mut all_indices: Vec<u32> = Vec::new();
        let mut draw_calls: Vec<GpuDrawCall> = Vec::new();

        for draw in &pending {
            let first_index = all_indices.len() as u32;

            let ok = tessellate_command(
                &draw.command,
                self.tolerance,
                &mut self.fill_tess,
                &mut self.stroke_tess,
                &mut all_vertices,
                &mut all_indices,
            );

            if ok {
                draw_calls.push(GpuDrawCall {
                    first_index,
                    index_count: all_indices.len() as u32 - first_index,
                    model_matrix: Float32Array::new(draw.world_transform.to_vec()),
                });
            }
        }

        Ok(FlushOutput {
            vertices: Float32Array::new(all_vertices),
            indices: Uint32Array::new(all_indices),
            draw_calls,
        })
    }

    #[napi]
    pub fn clear(&mut self) {
        self.pending.clear();
        self.current_path = None;
        self.path_builder = None;
    }
}
