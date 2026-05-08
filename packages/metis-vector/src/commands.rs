use lyon_path::Path;

#[derive(Clone, Debug)]
pub enum FillRule {
    NonZero,
    EvenOdd,
}

// ---------------------------------------------------------------------------
// Paint — per-draw-call fragment descriptor, std140-packed into 16 f32s
// ---------------------------------------------------------------------------

#[derive(Clone, Debug)]
pub struct Paint {
    pub color_a: [f32; 4],
    pub color_b: [f32; 4],
    pub gradient_start: [f32; 2],
    pub gradient_end: [f32; 2],
    pub mode: u32, // 0=flat, 1=linear, 2=radial
}

impl Paint {
    pub fn flat(color: [f32; 4]) -> Self {
        Paint {
            color_a: color,
            color_b: [0.0; 4],
            gradient_start: [0.0; 2],
            gradient_end: [0.0; 2],
            mode: 0,
        }
    }

    pub fn linear(
        color_a: [f32; 4],
        color_b: [f32; 4],
        start: [f32; 2],
        end: [f32; 2],
    ) -> Self {
        Paint { color_a, color_b, gradient_start: start, gradient_end: end, mode: 1 }
    }

    pub fn radial(
        color_a: [f32; 4],
        color_b: [f32; 4],
        center: [f32; 2],
        radius: f32,
    ) -> Self {
        // gradient_end stores a point on the outer circle so the shader can
        // recover the radius as length(gradient_end - gradient_start).
        Paint {
            color_a,
            color_b,
            gradient_start: center,
            gradient_end: [center[0] + radius, center[1]],
            mode: 2,
        }
    }

    /// Serialize to a 64-byte std140 Float32Array (16 f32).
    ///
    /// Layout:
    ///   [0..4]   color_a
    ///   [4..8]   color_b
    ///   [8..10]  gradient_start
    ///   [10..12] gradient_end
    ///   [12]     mode (cast from u32)
    ///   [13..16] padding
    pub fn to_std140(&self) -> [f32; 16] {
        [
            self.color_a[0], self.color_a[1], self.color_a[2], self.color_a[3],
            self.color_b[0], self.color_b[1], self.color_b[2], self.color_b[3],
            self.gradient_start[0], self.gradient_start[1],
            self.gradient_end[0],   self.gradient_end[1],
            self.mode as f32,
            0.0, 0.0, 0.0,
        ]
    }
}

// ---------------------------------------------------------------------------
// Draw commands
// ---------------------------------------------------------------------------

#[derive(Clone, Debug)]
pub enum PaintCommand {
    Fill {
        path: Path,
        fill_rule: FillRule,
    },
    Stroke {
        path: Path,
        width: f32,
    },
    /// Pre-tessellated geometry from the glyph cache — positions already
    /// transformed to screen space, indices using local (0-based) numbering.
    PreTessellated {
        vertices: Vec<[f32; 2]>,
        indices: Vec<u32>,
    },
}
