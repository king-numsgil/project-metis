use lyon_path::Path;
#[cfg(test)]
use lyon_path::math::point;
use lyon_tessellation::{
    BuffersBuilder, FillOptions, FillRule, FillTessellator, FillVertex,
    StrokeOptions, StrokeTessellator, StrokeVertex, VertexBuffers,
    LineCap, LineJoin,
};

use crate::commands::{FillRule as CmdFillRule, PaintCommand};

#[derive(Clone, Debug)]
pub struct Vertex {
    pub x: f32,
    pub y: f32,
    pub r: f32,
    pub g: f32,
    pub b: f32,
    pub a: f32,
}

pub struct TessOutput {
    pub vertices: Vec<Vertex>,
    pub indices: Vec<u32>,
}

pub fn tessellate_fill(
    path: &Path,
    color: [f32; 4],
    fill_rule: &CmdFillRule,
    tolerance: f32,
) -> Option<TessOutput> {
    let mut buffers: VertexBuffers<Vertex, u32> = VertexBuffers::new();
    let mut tessellator = FillTessellator::new();

    let lyon_rule = match fill_rule {
        CmdFillRule::NonZero => FillRule::NonZero,
        CmdFillRule::EvenOdd => FillRule::EvenOdd,
    };

    let options = FillOptions::default()
        .with_tolerance(tolerance)
        .with_fill_rule(lyon_rule);

    let result = tessellator.tessellate_path(
        path,
        &options,
        &mut BuffersBuilder::new(&mut buffers, |vertex: FillVertex| {
            let pos = vertex.position();
            Vertex { x: pos.x, y: pos.y, r: color[0], g: color[1], b: color[2], a: color[3] }
        }),
    );

    match result {
        Ok(_) => Some(TessOutput {
            vertices: buffers.vertices,
            indices: buffers.indices,
        }),
        Err(e) => {
            eprintln!("Fill tessellation failed: {:?}", e);
            None
        }
    }
}

pub fn tessellate_stroke(
    path: &Path,
    color: [f32; 4],
    width: f32,
    tolerance: f32,
) -> Option<TessOutput> {
    let mut buffers: VertexBuffers<Vertex, u32> = VertexBuffers::new();
    let mut tessellator = StrokeTessellator::new();

    let options = StrokeOptions::default()
        .with_tolerance(tolerance)
        .with_line_width(width)
        .with_line_cap(LineCap::Round)
        .with_line_join(LineJoin::Round);

    let result = tessellator.tessellate_path(
        path,
        &options,
        &mut BuffersBuilder::new(&mut buffers, |vertex: StrokeVertex| {
            let pos = vertex.position();
            Vertex { x: pos.x, y: pos.y, r: color[0], g: color[1], b: color[2], a: color[3] }
        }),
    );

    match result {
        Ok(_) => Some(TessOutput {
            vertices: buffers.vertices,
            indices: buffers.indices,
        }),
        Err(e) => {
            eprintln!("Stroke tessellation failed: {:?}", e);
            None
        }
    }
}

pub fn tessellate_command(cmd: &PaintCommand, tolerance: f32) -> Option<TessOutput> {
    match cmd {
        PaintCommand::Fill { path, color, fill_rule } => {
            tessellate_fill(path, *color, fill_rule, tolerance)
        }
        PaintCommand::Stroke { path, color, width } => {
            tessellate_stroke(path, *color, *width, tolerance)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::FillRule as CmdFillRule;

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
        let path = square_path();
        let out = tessellate_fill(&path, [1.0, 0.0, 0.0, 1.0], &CmdFillRule::NonZero, 0.25);
        let out = out.expect("fill tessellation should succeed");
        assert!(!out.vertices.is_empty());
        assert!(!out.indices.is_empty());
        assert_eq!(out.indices.len() % 3, 0);
    }

    #[test]
    fn tessellate_stroke_square() {
        let path = square_path();
        let out = tessellate_stroke(&path, [0.0, 1.0, 0.0, 1.0], 2.0, 0.25);
        let out = out.expect("stroke tessellation should succeed");
        assert!(!out.vertices.is_empty());
        assert_eq!(out.indices.len() % 3, 0);
    }

    #[test]
    fn tessellate_fill_vertex_color() {
        let path = square_path();
        let color = [0.5, 0.25, 0.1, 0.8];
        let out = tessellate_fill(&path, color, &CmdFillRule::NonZero, 0.25).unwrap();
        for v in &out.vertices {
            assert!((v.r - 0.5).abs() < 1e-6);
            assert!((v.a - 0.8).abs() < 1e-6);
        }
    }
}
