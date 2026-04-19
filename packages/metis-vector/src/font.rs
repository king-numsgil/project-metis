use std::collections::HashMap;
use lyon_path::path::Builder;
use lyon_path::geom::euclid::default::Transform2D;
use lyon_path::math::{point, vector};
use ttf_parser::Face;

use crate::commands::FillRule;

// ---------------------------------------------------------------------------
// Font store — bytes + face index, so .ttc collections work correctly
// ---------------------------------------------------------------------------

pub struct FontStore {
    fonts: HashMap<String, (Vec<u8>, u32)>,
}

impl FontStore {
    pub fn new() -> Self {
        FontStore { fonts: HashMap::new() }
    }

    pub fn load(&mut self, name: String, path: &str, face_index: u32) -> Result<(), String> {
        let bytes = std::fs::read(path)
            .map_err(|e| format!("Failed to read font file '{}': {}", path, e))?;
        ttf_parser::Face::parse(&bytes, face_index)
            .map_err(|e| format!("Failed to parse font '{}': {:?}", path, e))?;
        self.fonts.insert(name, (bytes, face_index));
        Ok(())
    }

    pub fn unload(&mut self, name: &str) {
        self.fonts.remove(name);
    }

    fn parse<'a>(&'a self, name: &str) -> Result<Face<'a>, String> {
        let (bytes, idx) = self.fonts.get(name)
            .ok_or_else(|| format!("Unknown font: '{}'", name))?;
        Face::parse(bytes, *idx)
            .map_err(|e| format!("Failed to parse font '{}': {:?}", name, e))
    }
}

// ---------------------------------------------------------------------------
// GlyphWriter — implements ttf_parser::OutlineBuilder by writing directly
// into a shared compound Lyon path builder with the per-glyph transform
// applied inline.  No per-glyph Path allocation or collect() call.
// ---------------------------------------------------------------------------

struct GlyphWriter<'a> {
    builder: &'a mut Builder,
    transform: Transform2D<f32>,
}

impl ttf_parser::OutlineBuilder for GlyphWriter<'_> {
    fn move_to(&mut self, x: f32, y: f32) {
        self.builder.begin(self.transform.transform_point(point(x, y)));
    }

    fn line_to(&mut self, x: f32, y: f32) {
        self.builder.line_to(self.transform.transform_point(point(x, y)));
    }

    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        self.builder.quadratic_bezier_to(
            self.transform.transform_point(point(x1, y1)),
            self.transform.transform_point(point(x, y)),
        );
    }

    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        self.builder.cubic_bezier_to(
            self.transform.transform_point(point(x1, y1)),
            self.transform.transform_point(point(x2, y2)),
            self.transform.transform_point(point(x, y)),
        );
    }

    fn close(&mut self) {
        self.builder.close();
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Expand `text` into a single compound Lyon path written directly into
/// `builder`.  Returns the correct fill rule for the font's outline format.
pub fn expand_text_path(
    font_store: &FontStore,
    font_name: &str,
    size_px: f32,
    text: &str,
    origin_x: f32,
    origin_y: f32,
    local_transform: &Transform2D<f32>,
    builder: &mut Builder,
) -> Result<FillRule, String> {
    let face = font_store.parse(font_name)?;

    let fill_rule = if face.tables().cff.is_some() { FillRule::EvenOdd } else { FillRule::NonZero };

    let upm = face.units_per_em() as f32;
    let scale = size_px / upm;
    let mut cursor_fu: f32 = 0.0;

    for ch in text.chars() {
        let glyph_id = face.glyph_index(ch);
        let is_whitespace = ch.is_ascii_whitespace();

        let advance_fu = glyph_id
            .and_then(|id| face.glyph_hor_advance(id))
            .map(|a| a as f32)
            .unwrap_or(upm * 0.5);

        let cursor_px = cursor_fu * scale + origin_x;

        match glyph_id {
            None => {
                if !is_whitespace {
                    write_notdef_box(builder, size_px, cursor_px, origin_y, scale, upm, local_transform);
                }
            }
            Some(id) => {
                // Y-flip in font space, then translate to screen position,
                // then apply the caller's local transform.
                let glyph_transform = Transform2D::scale(scale, -scale)
                    .then_translate(vector(cursor_px, origin_y))
                    .then(local_transform);

                let mut writer = GlyphWriter { builder, transform: glyph_transform };
                let has_outline = face.outline_glyph(id, &mut writer).is_some();

                if !has_outline && !is_whitespace {
                    write_notdef_box(builder, size_px, cursor_px, origin_y, scale, upm, local_transform);
                }
            }
        }

        cursor_fu += advance_fu;
    }

    Ok(fill_rule)
}

pub fn measure_text_width(
    font_store: &FontStore,
    font_name: &str,
    size_px: f32,
    text: &str,
) -> Result<f32, String> {
    let face = font_store.parse(font_name)?;
    let upm = face.units_per_em() as f32;
    let scale = size_px / upm;

    let mut cursor_fu: f32 = 0.0;
    for ch in text.chars() {
        cursor_fu += face
            .glyph_index(ch)
            .and_then(|id| face.glyph_hor_advance(id))
            .map(|a| a as f32)
            .unwrap_or(upm * 0.5);
    }

    Ok(cursor_fu * scale)
}

pub fn get_font_metrics(
    font_store: &FontStore,
    font_name: &str,
    size_px: f32,
) -> Result<(f32, f32, f32, f32, f32, f32, f32), String> {
    let face = font_store.parse(font_name)?;
    let upm = face.units_per_em() as f32;
    let scale = size_px / upm;

    let ascender  = face.ascender()  as f32 * scale;
    let descender = face.descender() as f32 * scale;
    let line_gap  = face.line_gap()  as f32 * scale;
    let line_height = ascender - descender + line_gap;

    let cap_height = face.capital_height()
        .map(|v| v as f32 * scale)
        .unwrap_or(ascender * 0.72);

    let x_height = face.x_height()
        .map(|v| v as f32 * scale)
        .unwrap_or(ascender * 0.53);

    Ok((ascender, descender, line_gap, line_height, cap_height, x_height, upm))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn write_notdef_box(
    builder: &mut Builder,
    size_px: f32,
    cursor_px: f32,
    origin_y: f32,
    scale: f32,
    upm: f32,
    local_transform: &Transform2D<f32>,
) {
    let width  = upm * 0.5 * scale;
    let height = size_px * 0.7;
    let inset  = size_px * 0.05;

    let p0 = local_transform.transform_point(point(cursor_px + inset,         origin_y - height + inset));
    let p1 = local_transform.transform_point(point(cursor_px + width - inset, origin_y - height + inset));
    let p2 = local_transform.transform_point(point(cursor_px + width - inset, origin_y - inset));
    let p3 = local_transform.transform_point(point(cursor_px + inset,         origin_y - inset));

    builder.begin(p0);
    builder.line_to(p1);
    builder.line_to(p2);
    builder.line_to(p3);
    builder.close();
}

#[cfg(test)]
mod tests {
    use super::*;
    use lyon_path::geom::euclid::default::Transform2D;
    use lyon_path::Path;

    #[test]
    fn notdef_box_produces_four_points() {
        let t = Transform2D::identity();
        let mut builder = Path::builder();
        write_notdef_box(&mut builder, 16.0, 0.0, 0.0, 1.0, 1000.0, &t);
        let path = builder.build();
        let events: Vec<_> = path.iter().collect();
        // begin + 3 line_to + close = 5 events
        assert_eq!(events.len(), 5);
    }

    #[test]
    fn measure_text_unknown_font_errors() {
        let store = FontStore::new();
        assert!(measure_text_width(&store, "nonexistent", 16.0, "hello").is_err());
    }
}
