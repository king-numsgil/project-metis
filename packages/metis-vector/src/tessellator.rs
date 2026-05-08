use lyon_path::Path;
use lyon_tessellation::{
    FillGeometryBuilder, FillOptions, FillRule, FillTessellator, FillVertex,
    GeometryBuilder, GeometryBuilderError, StrokeGeometryBuilder, StrokeOptions,
    StrokeTessellator, StrokeVertex, VertexId,
    LineCap, LineJoin,
};

use crate::commands::{FillRule as CmdFillRule, PaintCommand};

// ---------------------------------------------------------------------------
// Position-only geometry builder — used by both the tessellator (for UV
// generation) and font.rs (for glyph cache pre-warming).
// ---------------------------------------------------------------------------

pub struct PositionCollector {
    pub positions: Vec<[f32; 2]>,
    pub indices: Vec<u32>,
    base_vertex: u32,
}

impl PositionCollector {
    pub fn new() -> Self {
        PositionCollector {
            positions: Vec::with_capacity(64),
            indices: Vec::with_capacity(96),
            base_vertex: 0,
        }
    }
}

impl GeometryBuilder for PositionCollector {
    fn begin_geometry(&mut self) {
        self.base_vertex = self.positions.len() as u32;
    }

    fn add_triangle(&mut self, a: VertexId, b: VertexId, c: VertexId) {
        self.indices.push(a.0 + self.base_vertex);
        self.indices.push(b.0 + self.base_vertex);
        self.indices.push(c.0 + self.base_vertex);
    }
}

impl FillGeometryBuilder for PositionCollector {
    fn add_fill_vertex(
        &mut self,
        vertex: FillVertex,
    ) -> Result<VertexId, GeometryBuilderError> {
        let local_id = self.positions.len() as u32 - self.base_vertex;
        let pos = vertex.position();
        self.positions.push([pos.x, pos.y]);
        Ok(VertexId(local_id))
    }
}

impl StrokeGeometryBuilder for PositionCollector {
    fn add_stroke_vertex(
        &mut self,
        vertex: StrokeVertex,
    ) -> Result<VertexId, GeometryBuilderError> {
        let local_id = self.positions.len() as u32 - self.base_vertex;
        let pos = vertex.position();
        self.positions.push([pos.x, pos.y]);
        Ok(VertexId(local_id))
    }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

fn fill_positions(
    tessellator: &mut FillTessellator,
    path: &Path,
    fill_rule: &CmdFillRule,
    tolerance: f32,
    collector: &mut PositionCollector,
) -> bool {
    let lyon_rule = match fill_rule {
        CmdFillRule::NonZero => FillRule::NonZero,
        CmdFillRule::EvenOdd => FillRule::EvenOdd,
    };
    let options = FillOptions::default()
        .with_tolerance(tolerance)
        .with_fill_rule(lyon_rule);
    match tessellator.tessellate_path(path, &options, collector) {
        Ok(_) => true,
        Err(e) => { eprintln!("Fill tessellation failed: {:?}", e); false }
    }
}

fn stroke_positions(
    tessellator: &mut StrokeTessellator,
    path: &Path,
    width: f32,
    tolerance: f32,
    collector: &mut PositionCollector,
) -> bool {
    let options = StrokeOptions::default()
        .with_tolerance(tolerance)
        .with_line_width(width)
        .with_line_cap(LineCap::Round)
        .with_line_join(LineJoin::Round);
    match tessellator.tessellate_path(path, &options, collector) {
        Ok(_) => true,
        Err(e) => { eprintln!("Stroke tessellation failed: {:?}", e); false }
    }
}

/// Compute AABB of a position list. Returns (min_x, min_y, max_x, max_y).
fn aabb(positions: &[[f32; 2]]) -> (f32, f32, f32, f32) {
    let mut min_x = f32::MAX;
    let mut min_y = f32::MAX;
    let mut max_x = f32::MIN;
    let mut max_y = f32::MIN;
    for &[x, y] in positions {
        if x < min_x { min_x = x; }
        if y < min_y { min_y = y; }
        if x > max_x { max_x = x; }
        if y > max_y { max_y = y; }
    }
    (min_x, min_y, max_x, max_y)
}

/// Emit [x, y, u, v] vertices into `out_vertices`, offsetting `local_indices`
/// by `vertex_base` into `out_indices`.
///
/// UVs are derived from the tight AABB of `positions` (post-transform space).
/// Degenerate axes (zero width or height) clamp UV to 0.0.
fn emit_with_uvs(
    positions: &[[f32; 2]],
    local_indices: &[u32],
    out_vertices: &mut Vec<f32>,
    out_indices: &mut Vec<u32>,
) {
    let vertex_base = (out_vertices.len() / 4) as u32;

    let (min_x, min_y, max_x, max_y) = aabb(positions);
    let w = max_x - min_x;
    let h = max_y - min_y;

    out_vertices.reserve(positions.len() * 4);
    out_indices.reserve(local_indices.len());

    for &[x, y] in positions {
        let u = if w > 0.0 { (x - min_x) / w } else { 0.0 };
        let v = if h > 0.0 { (y - min_y) / h } else { 0.0 };
        out_vertices.extend_from_slice(&[x, y, u, v]);
    }
    for &idx in local_indices {
        out_indices.push(idx + vertex_base);
    }
}

// ---------------------------------------------------------------------------
// Public tessellation entry point
// ---------------------------------------------------------------------------

pub fn tessellate_command(
    cmd: PaintCommand,
    tolerance: f32,
    fill_tess: &mut FillTessellator,
    stroke_tess: &mut StrokeTessellator,
    vertices: &mut Vec<f32>,
    indices: &mut Vec<u32>,
) -> bool {
    // Phase 1: collect screen-space positions and local indices.
    let mut collector = PositionCollector::new();
    let ok = match cmd {
        PaintCommand::Fill { path, fill_rule } => {
            fill_positions(fill_tess, &path, &fill_rule, tolerance, &mut collector)
        }
        PaintCommand::Stroke { path, width } => {
            stroke_positions(stroke_tess, &path, width, tolerance, &mut collector)
        }
        PaintCommand::PreTessellated { vertices, indices } => {
            collector.positions = vertices;
            collector.indices = indices;
            true
        }
    };

    if !ok || collector.positions.is_empty() {
        return ok;
    }

    // Phase 2: compute per-draw-call AABB, generate UVs, emit [x, y, u, v].
    emit_with_uvs(&collector.positions, &collector.indices, vertices, indices);
    true
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::FillRule as CmdFillRule;
    use lyon_path::math::point;

    fn square_path() -> Path {
        let mut builder = Path::builder();
        builder.begin(point(0.0, 0.0));
        builder.line_to(point(100.0, 0.0));
        builder.line_to(point(100.0, 100.0));
        builder.line_to(point(0.0, 100.0));
        builder.close();
        builder.build()
    }

    #[test]
    fn tessellate_fill_square() {
        let mut tess = FillTessellator::new();
        let mut collector = PositionCollector::new();
        let path = square_path();
        let ok = fill_positions(&mut tess, &path, &CmdFillRule::NonZero, 0.25, &mut collector);
        assert!(ok);
        assert!(!collector.positions.is_empty());
        assert!(!collector.indices.is_empty());
        assert_eq!(collector.indices.len() % 3, 0);
    }

    #[test]
    fn tessellate_stroke_square() {
        let mut tess = StrokeTessellator::new();
        let mut collector = PositionCollector::new();
        let path = square_path();
        let ok = stroke_positions(&mut tess, &path, 2.0, 0.25, &mut collector);
        assert!(ok);
        assert!(!collector.positions.is_empty());
        assert_eq!(collector.indices.len() % 3, 0);
    }

    #[test]
    fn uv_range_zero_to_one() {
        let mut fill_tess = FillTessellator::new();
        let mut stroke_tess = StrokeTessellator::new();
        let path = square_path();
        let cmd = PaintCommand::Fill {
            path,
            fill_rule: CmdFillRule::NonZero,
        };
        let mut verts = Vec::new();
        let mut idxs = Vec::new();
        let ok = tessellate_command(cmd, 0.25, &mut fill_tess, &mut stroke_tess, &mut verts, &mut idxs);
        assert!(ok);
        // stride is 4: [x, y, u, v]
        assert_eq!(verts.len() % 4, 0);
        for chunk in verts.chunks_exact(4) {
            let u = chunk[2];
            let v = chunk[3];
            assert!(u >= 0.0 && u <= 1.0, "u={u} out of [0,1]");
            assert!(v >= 0.0 && v <= 1.0, "v={v} out of [0,1]");
        }
    }

    #[test]
    fn multi_draw_indices_non_overlapping() {
        let mut fill_tess = FillTessellator::new();
        let mut stroke_tess = StrokeTessellator::new();
        let mut verts = Vec::new();
        let mut idxs = Vec::new();
        let path = square_path();
        let cmd = PaintCommand::Fill { path: path.clone(), fill_rule: CmdFillRule::NonZero };
        tessellate_command(cmd, 0.25, &mut fill_tess, &mut stroke_tess, &mut verts, &mut idxs);
        let first_vcount = verts.len() / 4;
        let cmd2 = PaintCommand::Fill { path, fill_rule: CmdFillRule::NonZero };
        tessellate_command(cmd2, 0.25, &mut fill_tess, &mut stroke_tess, &mut verts, &mut idxs);
        // Every index in the second batch must be >= first_vcount
        let second_batch = &idxs[idxs.len() / 2..];
        for &idx in second_batch {
            assert!(idx >= first_vcount as u32);
        }
    }

    #[test]
    fn pre_tessellated_passthrough() {
        let mut fill_tess = FillTessellator::new();
        let mut stroke_tess = StrokeTessellator::new();
        let verts_in: Vec<[f32; 2]> = vec![[0.0, 0.0], [10.0, 0.0], [10.0, 10.0], [0.0, 10.0]];
        let idxs_in: Vec<u32> = vec![0, 1, 2, 0, 2, 3];
        let cmd = PaintCommand::PreTessellated {
            vertices: verts_in.clone(),
            indices: idxs_in.clone(),
        };
        let mut verts = Vec::new();
        let mut idxs = Vec::new();
        let ok = tessellate_command(cmd, 0.25, &mut fill_tess, &mut stroke_tess, &mut verts, &mut idxs);
        assert!(ok);
        assert_eq!(verts.len(), verts_in.len() * 4); // [x,y,u,v] per vertex
        assert_eq!(idxs, idxs_in);
    }
}
