use lyon_path::Path;
use lyon_tessellation::{
    FillGeometryBuilder, FillOptions, FillRule, FillTessellator, FillVertex,
    GeometryBuilder, GeometryBuilderError, StrokeGeometryBuilder, StrokeOptions,
    StrokeTessellator, StrokeVertex, VertexId,
    LineCap, LineJoin,
};

use crate::commands::{FillRule as CmdFillRule, PaintCommand};

// ---------------------------------------------------------------------------
// Custom geometry builder — writes interleaved f32 directly into the caller's
// output buffers, eliminating the VertexBuffers<Vertex, u32> intermediary.
// ---------------------------------------------------------------------------

pub struct FlatOutput<'a> {
    pub vertices: &'a mut Vec<f32>,
    pub indices: &'a mut Vec<u32>,
    pub color: [f32; 4],
    base_vertex: u32,
}

impl<'a> FlatOutput<'a> {
    pub fn new(vertices: &'a mut Vec<f32>, indices: &'a mut Vec<u32>, color: [f32; 4]) -> Self {
        FlatOutput { vertices, indices, color, base_vertex: 0 }
    }
}

impl GeometryBuilder for FlatOutput<'_> {
    fn begin_geometry(&mut self) {
        self.base_vertex = (self.vertices.len() / 6) as u32;
    }

    fn add_triangle(&mut self, a: VertexId, b: VertexId, c: VertexId) {
        self.indices.push(a.0 + self.base_vertex);
        self.indices.push(b.0 + self.base_vertex);
        self.indices.push(c.0 + self.base_vertex);
    }
}

impl FillGeometryBuilder for FlatOutput<'_> {
    fn add_fill_vertex(
        &mut self,
        vertex: FillVertex,
    ) -> Result<VertexId, GeometryBuilderError> {
        let local_id = (self.vertices.len() / 6) as u32 - self.base_vertex;
        let pos = vertex.position();
        self.vertices.push(pos.x);
        self.vertices.push(pos.y);
        self.vertices.push(self.color[0]);
        self.vertices.push(self.color[1]);
        self.vertices.push(self.color[2]);
        self.vertices.push(self.color[3]);
        Ok(VertexId(local_id))
    }
}

impl StrokeGeometryBuilder for FlatOutput<'_> {
    fn add_stroke_vertex(
        &mut self,
        vertex: StrokeVertex,
    ) -> Result<VertexId, GeometryBuilderError> {
        let local_id = (self.vertices.len() / 6) as u32 - self.base_vertex;
        let pos = vertex.position();
        self.vertices.push(pos.x);
        self.vertices.push(pos.y);
        self.vertices.push(self.color[0]);
        self.vertices.push(self.color[1]);
        self.vertices.push(self.color[2]);
        self.vertices.push(self.color[3]);
        Ok(VertexId(local_id))
    }
}

// ---------------------------------------------------------------------------
// Tessellation entry points — tessellators are caller-owned and reused
// ---------------------------------------------------------------------------

pub fn tessellate_fill(
    tessellator: &mut FillTessellator,
    path: &Path,
    color: [f32; 4],
    fill_rule: &CmdFillRule,
    tolerance: f32,
    vertices: &mut Vec<f32>,
    indices: &mut Vec<u32>,
) -> bool {
    let lyon_rule = match fill_rule {
        CmdFillRule::NonZero => FillRule::NonZero,
        CmdFillRule::EvenOdd => FillRule::EvenOdd,
    };

    let options = FillOptions::default()
        .with_tolerance(tolerance)
        .with_fill_rule(lyon_rule);

    let mut output = FlatOutput::new(vertices, indices, color);

    match tessellator.tessellate_path(path, &options, &mut output) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("Fill tessellation failed: {:?}", e);
            false
        }
    }
}

pub fn tessellate_stroke(
    tessellator: &mut StrokeTessellator,
    path: &Path,
    color: [f32; 4],
    width: f32,
    tolerance: f32,
    vertices: &mut Vec<f32>,
    indices: &mut Vec<u32>,
) -> bool {
    let options = StrokeOptions::default()
        .with_tolerance(tolerance)
        .with_line_width(width)
        .with_line_cap(LineCap::Round)
        .with_line_join(LineJoin::Round);

    let mut output = FlatOutput::new(vertices, indices, color);

    match tessellator.tessellate_path(path, &options, &mut output) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("Stroke tessellation failed: {:?}", e);
            false
        }
    }
}

pub fn tessellate_command(
    cmd: &PaintCommand,
    tolerance: f32,
    fill_tess: &mut FillTessellator,
    stroke_tess: &mut StrokeTessellator,
    vertices: &mut Vec<f32>,
    indices: &mut Vec<u32>,
) -> bool {
    match cmd {
        PaintCommand::Fill { path, color, fill_rule } => {
            tessellate_fill(fill_tess, path, *color, fill_rule, tolerance, vertices, indices)
        }
        PaintCommand::Stroke { path, color, width } => {
            tessellate_stroke(stroke_tess, path, *color, *width, tolerance, vertices, indices)
        }
    }
}

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
        let mut verts = Vec::new();
        let mut idxs = Vec::new();
        let path = square_path();
        let ok = tessellate_fill(&mut tess, &path, [1.0, 0.0, 0.0, 1.0], &CmdFillRule::NonZero, 0.25, &mut verts, &mut idxs);
        assert!(ok);
        assert!(!verts.is_empty());
        assert!(!idxs.is_empty());
        assert_eq!(verts.len() % 6, 0);
        assert_eq!(idxs.len() % 3, 0);
    }

    #[test]
    fn tessellate_stroke_square() {
        let mut tess = StrokeTessellator::new();
        let mut verts = Vec::new();
        let mut idxs = Vec::new();
        let path = square_path();
        let ok = tessellate_stroke(&mut tess, &path, [0.0, 1.0, 0.0, 1.0], 2.0, 0.25, &mut verts, &mut idxs);
        assert!(ok);
        assert!(!verts.is_empty());
        assert_eq!(idxs.len() % 3, 0);
    }

    #[test]
    fn tessellate_fill_vertex_color() {
        let mut tess = FillTessellator::new();
        let mut verts = Vec::new();
        let mut idxs = Vec::new();
        let path = square_path();
        let color = [0.5, 0.25, 0.1, 0.8];
        tessellate_fill(&mut tess, &path, color, &CmdFillRule::NonZero, 0.25, &mut verts, &mut idxs);
        for chunk in verts.chunks_exact(6) {
            assert!((chunk[2] - 0.5).abs() < 1e-6); // r
            assert!((chunk[5] - 0.8).abs() < 1e-6); // a
        }
    }

    #[test]
    fn multi_draw_indices_non_overlapping() {
        // Two back-to-back tessellations into the same buffers — indices must
        // not alias each other.
        let mut tess = FillTessellator::new();
        let mut verts = Vec::new();
        let mut idxs = Vec::new();
        let path = square_path();
        tessellate_fill(&mut tess, &path, [1.0, 0.0, 0.0, 1.0], &CmdFillRule::NonZero, 0.25, &mut verts, &mut idxs);
        let first_vcount = verts.len() / 6;
        tessellate_fill(&mut tess, &path, [0.0, 1.0, 0.0, 1.0], &CmdFillRule::NonZero, 0.25, &mut verts, &mut idxs);
        // Every index in the second batch must be >= first_vcount
        let second_batch_indices = &idxs[idxs.len() / 2..]; // rough split
        for &idx in second_batch_indices {
            assert!(idx >= first_vcount as u32);
        }
    }
}
