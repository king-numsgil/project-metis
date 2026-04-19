use lyon_path::Path;

#[derive(Clone, Debug)]
pub enum FillRule {
    NonZero,
    EvenOdd,
}

#[derive(Clone, Debug)]
pub enum PaintCommand {
    Fill {
        path: Path,
        color: [f32; 4],
        fill_rule: FillRule,
    },
    Stroke {
        path: Path,
        color: [f32; 4],
        width: f32,
    },
}
