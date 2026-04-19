use std::collections::HashMap;
use lyon_path::Path;
use lyon_path::geom::euclid::default::Transform2D;
use lyon_path::iterator::PathIterator;
use lyon_path::math::{point, vector};
use ttf_parser::Face;

use crate::commands::FillRule;

pub struct FontStore {
    fonts: HashMap<String, Vec<u8>>,
}

impl FontStore {
    pub fn new() -> Self {
        FontStore {
            fonts: HashMap::new(),
        }
    }

    pub fn load(&mut self, name: String, path: &str, face_index: u32) -> Result<(), String> {
        let bytes = std::fs::read(path)
            .map_err(|e| format!("Failed to read font file '{}': {}", path, e))?;
        // Validate it parses
        ttf_parser::Face::parse(&bytes, face_index)
            .map_err(|e| format!("Failed to parse font '{}': {:?}", path, e))?;
        self.fonts.insert(name, bytes);
        Ok(())
    }

    pub fn unload(&mut self, name: &str) {
        self.fonts.remove(name);
    }

    pub fn get_bytes(&self, name: &str) -> Option<&Vec<u8>> {
        self.fonts.get(name)
    }
}

pub struct GlyphPaths {
    pub paths: Vec<Path>,
    pub fill_rule: FillRule,
}

struct PathBuilder {
    builder: lyon_path::path::Builder,
}

impl ttf_parser::OutlineBuilder for PathBuilder {
    fn move_to(&mut self, x: f32, y: f32) {
        self.builder.begin(point(x, y));
    }

    fn line_to(&mut self, x: f32, y: f32) {
        self.builder.line_to(point(x, y));
    }

    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        self.builder.quadratic_bezier_to(point(x1, y1), point(x, y));
    }

    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        self.builder.cubic_bezier_to(point(x1, y1), point(x2, y2), point(x, y));
    }

    fn close(&mut self) {
        self.builder.close();
    }
}

pub fn expand_text_path(
    font_store: &FontStore,
    font_name: &str,
    size_px: f32,
    text: &str,
    origin_x: f32,
    origin_y: f32,
    local_transform: &Transform2D<f32>,
) -> Result<GlyphPaths, String> {
    let bytes = font_store
        .get_bytes(font_name)
        .ok_or_else(|| format!("Unknown font: '{}'", font_name))?;

    let face = Face::parse(bytes, 0)
        .map_err(|e| format!("Failed to parse font '{}': {:?}", font_name, e))?;

    let is_cff = face.tables().cff.is_some();
    let fill_rule = if is_cff { FillRule::EvenOdd } else { FillRule::NonZero };

    let upm = face.units_per_em() as f32;
    let scale = size_px / upm;

    let mut paths = Vec::new();
    let mut cursor_fu: f32 = 0.0; // accumulate in font units

    for ch in text.chars() {
        let glyph_id = face.glyph_index(ch);

        let is_whitespace = ch.is_ascii_whitespace();

        let advance_fu = glyph_id
            .and_then(|id| face.glyph_hor_advance(id))
            .map(|a| a as f32)
            .unwrap_or(upm * 0.5);

        match glyph_id {
            None => {
                if !is_whitespace {
                    let cursor_px = cursor_fu * scale + origin_x;
                    let path = notdef_box(size_px, cursor_px, origin_y, scale, upm, local_transform);
                    paths.push(path);
                }
            }
            Some(id) => {
                let cursor_px = cursor_fu * scale + origin_x;
                let glyph_transform = Transform2D::scale(scale, -scale)
                    .then_translate(vector(cursor_px, origin_y))
                    .then(&local_transform);

                let mut pb = PathBuilder {
                    builder: Path::builder(),
                };

                let has_outline = face.outline_glyph(id, &mut pb).is_some();

                if has_outline {
                    let raw_path = pb.builder.build();
                    let transformed = raw_path
                        .iter()
                        .transformed(&glyph_transform)
                        .collect::<Path>();
                    paths.push(transformed);
                } else if !is_whitespace {
                    let path = notdef_box(size_px, cursor_px, origin_y, scale, upm, local_transform);
                    paths.push(path);
                }
            }
        }

        cursor_fu += advance_fu;
    }

    Ok(GlyphPaths { paths, fill_rule })
}

pub fn measure_text_width(
    font_store: &FontStore,
    font_name: &str,
    size_px: f32,
    text: &str,
) -> Result<f32, String> {
    let bytes = font_store
        .get_bytes(font_name)
        .ok_or_else(|| format!("Unknown font: '{}'", font_name))?;

    let face = Face::parse(bytes, 0)
        .map_err(|e| format!("Failed to parse font '{}': {:?}", font_name, e))?;

    let upm = face.units_per_em() as f32;
    let scale = size_px / upm;

    let mut cursor_fu: f32 = 0.0;
    for ch in text.chars() {
        let advance_fu = face
            .glyph_index(ch)
            .and_then(|id| face.glyph_hor_advance(id))
            .map(|a| a as f32)
            .unwrap_or(upm * 0.5);
        cursor_fu += advance_fu;
    }

    Ok(cursor_fu * scale)
}

pub fn get_font_metrics(
    font_store: &FontStore,
    font_name: &str,
    size_px: f32,
) -> Result<(f32, f32, f32, f32, f32, f32, f32), String> {
    let bytes = font_store
        .get_bytes(font_name)
        .ok_or_else(|| format!("Unknown font: '{}'", font_name))?;

    let face = Face::parse(bytes, 0)
        .map_err(|e| format!("Failed to parse font '{}': {:?}", font_name, e))?;

    let upm = face.units_per_em() as f32;
    let scale = size_px / upm;

    let ascender = face.ascender() as f32 * scale;
    let descender = face.descender() as f32 * scale;
    let line_gap = face.line_gap() as f32 * scale;
    let line_height = ascender - descender + line_gap;

    let cap_height = face
        .capital_height()
        .map(|v| v as f32 * scale)
        .unwrap_or(ascender * 0.72);

    let x_height = face
        .x_height()
        .map(|v| v as f32 * scale)
        .unwrap_or(ascender * 0.53);

    Ok((ascender, descender, line_gap, line_height, cap_height, x_height, upm))
}

fn notdef_box(
    size_px: f32,
    cursor_px: f32,
    origin_y: f32,
    scale: f32,
    upm: f32,
    local_transform: &Transform2D<f32>,
) -> Path {
    let width = upm * 0.5 * scale;
    let height = size_px * 0.7;
    let inset = size_px * 0.05;

    let x0 = cursor_px + inset;
    let x1 = cursor_px + width - inset;
    let y0 = origin_y - height + inset;
    let y1 = origin_y - inset;

    let mut builder = Path::builder();
    builder.begin(point(x0, y0));
    builder.line_to(point(x1, y0));
    builder.line_to(point(x1, y1));
    builder.line_to(point(x0, y1));
    builder.close();

    builder.build()
        .iter()
        .transformed(local_transform)
        .collect::<Path>()
}

#[cfg(test)]
mod tests {
    use super::*;
    use lyon_path::geom::euclid::default::Transform2D;

    #[test]
    fn notdef_box_produces_four_points() {
        let t = Transform2D::identity();
        let path = notdef_box(16.0, 0.0, 0.0, 1.0, 1000.0, &t);
        let events: Vec<_> = path.iter().collect();
        // begin + 3 line_to + close = 5 events
        assert_eq!(events.len(), 5);
    }

    #[test]
    fn measure_text_unknown_font_errors() {
        let store = FontStore::new();
        let result = measure_text_width(&store, "nonexistent", 16.0, "hello");
        assert!(result.is_err());
    }
}
