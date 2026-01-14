use naga::Module;
use naga::valid::{Capabilities, ModuleInfo, ValidationFlags, Validator};
use naga::{back, front};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// WGSL -> Naga IR + validation.
fn parse_and_validate(wgsl: &str) -> Result<(Module, ModuleInfo), JsValue> {
    // WGSL -> IR
    let module =
        front::wgsl::parse_str(wgsl).map_err(|e| JsValue::from_str(&e.emit_to_string(wgsl)))?;
    // Validation
    let mut v = Validator::new(ValidationFlags::all(), Capabilities::all());
    let info = v
        .validate(&module)
        .map_err(|e| JsValue::from_str(&format!("{e:?}")))?;
    Ok((module, info))
}

/// Validates WGSL and returns true if valid, false otherwise.
#[wasm_bindgen(js_name = isWgslValid)]
pub fn is_wgsl_valid(wgsl: &str) -> bool {
    parse_and_validate(wgsl).is_ok()
}

/// Only validates WGSL (throws JS error if invalid).
#[wasm_bindgen(js_name = validateWgsl)]
pub fn validate_wgsl(wgsl: &str) -> Result<(), JsValue> {
    let _ = parse_and_validate(wgsl)?;
    Ok(())
}

/// WGSL -> SPIR-V (binary words -> LE bytes) for Vulkan.
/// If entry_point is provided, only compiles that specific entry point.
/// If entry_point is None or empty string, compiles all entry points.
#[wasm_bindgen(js_name = wgslToSpirvBin)]
pub fn wgsl_to_spirv_bin(wgsl: &str, entry_point: Option<String>) -> Result<Box<[u8]>, JsValue> {
    let (module, info) = parse_and_validate(wgsl)?;
    let spv_opts = back::spv::Options::default();

    // Determine pipeline options based on entry point
    let pipeline_opts = if let Some(ep_name) = entry_point {
        if ep_name.is_empty() {
            None
        } else {
            // Find the entry point in the module
            let entry = module
                .entry_points
                .iter()
                .find(|ep| ep.name == ep_name)
                .ok_or_else(|| {
                    JsValue::from_str(&format!("Entry point '{}' not found", ep_name))
                })?;

            Some(back::spv::PipelineOptions {
                shader_stage: entry.stage,
                entry_point: ep_name,
            })
        }
    } else {
        None
    };

    let words: Vec<u32> = back::spv::write_vec(&module, &info, &spv_opts, pipeline_opts.as_ref())
        .map_err(|e| JsValue::from_str(&format!("SPIR-V error: {e:?}")))?;

    // u32 words -> little-endian bytes
    let mut bytes = Vec::with_capacity(words.len() * 4);
    for w in words {
        bytes.extend_from_slice(&w.to_le_bytes());
    }
    Ok(bytes.into_boxed_slice())
}

/// WGSL -> MSL (Metal Shading Language) source code for Metal/macOS/iOS.
/// If entry_point is provided, only compiles that specific entry point.
/// If entry_point is None or empty string, compiles all entry points.
#[wasm_bindgen(js_name = wgslToMsl)]
pub fn wgsl_to_msl(wgsl: &str, entry_point: Option<String>) -> Result<String, JsValue> {
    let (module, info) = parse_and_validate(wgsl)?;

    // Build pipeline options based on entry point
    let msl_opts = back::msl::Options::default();

    if let Some(ep_name) = entry_point {
        if !ep_name.is_empty() {
            // Find the entry point in the module
            let entry = module
                .entry_points
                .iter()
                .find(|ep| ep.name == ep_name)
                .ok_or_else(|| {
                    JsValue::from_str(&format!("Entry point '{}' not found", ep_name))
                })?;

            // For MSL, we need to create PipelineOptions with the entry point info
            let pipeline_opts = back::msl::PipelineOptions {
                entry_point: Some((entry.stage, ep_name)),
                ..Default::default()
            };

            let (msl_source, _) =
                back::msl::write_string(&module, &info, &msl_opts, &pipeline_opts)
                    .map_err(|e| JsValue::from_str(&format!("MSL error: {e:?}")))?;

            return Ok(msl_source);
        }
    }

    // No specific entry point - compile all
    let pipeline_opts = back::msl::PipelineOptions::default();
    let (msl_source, _) = back::msl::write_string(&module, &info, &msl_opts, &pipeline_opts)
        .map_err(|e| JsValue::from_str(&format!("MSL error: {e:?}")))?;

    Ok(msl_source)
}

/// SPIR-V binary -> disassembled text for debugging.
/// Takes SPIR-V bytes (little-endian) and returns human-readable assembly.
#[wasm_bindgen(js_name = spirvBinToText)]
pub fn spirv_bin_to_text(spirv_bytes: &[u8]) -> Result<String, JsValue> {
    // Validate length
    if spirv_bytes.len() % 4 != 0 {
        return Err(JsValue::from_str(
            "SPIR-V binary length must be multiple of 4",
        ));
    }

    // Parse SPIR-V binary directly from bytes
    let spv_opts = front::spv::Options::default();
    let module = front::spv::parse_u8_slice(spirv_bytes, &spv_opts)
        .map_err(|e| JsValue::from_str(&format!("SPIR-V parse error: {e:?}")))?;

    // Validate
    let mut validator = Validator::new(ValidationFlags::all(), Capabilities::all());
    let info = validator
        .validate(&module)
        .map_err(|e| JsValue::from_str(&format!("SPIR-V validation error: {e:?}")))?;

    // Convert back to WGSL for human-readable output
    let wgsl_opts = back::wgsl::WriterFlags::all();
    let wgsl_text = back::wgsl::write_string(&module, &info, wgsl_opts)
        .map_err(|e| JsValue::from_str(&format!("WGSL write error: {e:?}")))?;

    Ok(wgsl_text)
}

// ============================================================================
// Reflection Types
// ============================================================================

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen(getter_with_clone)]
pub struct ReflectionData {
    #[wasm_bindgen(readonly)]
    pub entry_points: Vec<EntryPointInfo>,
    #[wasm_bindgen(readonly)]
    pub types: Vec<TypeInfo>,
}

#[wasm_bindgen]
impl ReflectionData {
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen(getter_with_clone)]
pub struct EntryPointInfo {
    #[wasm_bindgen(readonly)]
    pub name: String,
    #[wasm_bindgen(readonly)]
    pub stage: String,
    #[wasm_bindgen(readonly)]
    pub workgroup_size: Option<Vec<u32>>,
    #[wasm_bindgen(readonly)]
    pub bindings: Vec<BindingInfo>,
    #[wasm_bindgen(readonly)]
    pub vertex_inputs: Vec<VertexInputInfo>,
    #[wasm_bindgen(readonly)]
    pub fragment_outputs: Vec<FragmentOutputInfo>,
}

#[wasm_bindgen]
impl EntryPointInfo {
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen(getter_with_clone)]
pub struct BindingInfo {
    #[wasm_bindgen(readonly)]
    pub name: String,
    #[wasm_bindgen(readonly)]
    pub group: u32,
    #[wasm_bindgen(readonly)]
    pub binding: u32,
    #[wasm_bindgen(readonly)]
    pub resource_type: String,
    #[wasm_bindgen(readonly)]
    pub type_name: Option<String>,
}

#[wasm_bindgen]
impl BindingInfo {
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen(getter_with_clone)]
pub struct VertexInputInfo {
    #[wasm_bindgen(readonly)]
    pub name: String,
    #[wasm_bindgen(readonly)]
    pub location: u32,
    #[wasm_bindgen(readonly)]
    pub type_name: String,
}

#[wasm_bindgen]
impl VertexInputInfo {
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen(getter_with_clone)]
pub struct FragmentOutputInfo {
    #[wasm_bindgen(readonly)]
    pub name: String,
    #[wasm_bindgen(readonly)]
    pub location: u32,
    #[wasm_bindgen(readonly)]
    pub type_name: String,
}

#[wasm_bindgen]
impl FragmentOutputInfo {
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen(getter_with_clone)]
pub struct TypeInfo {
    #[wasm_bindgen(readonly)]
    pub name: String,
    #[wasm_bindgen(readonly)]
    pub kind: String,
    #[wasm_bindgen(readonly)]
    pub members: Option<Vec<StructMemberInfo>>,
}

#[wasm_bindgen]
impl TypeInfo {
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen(getter_with_clone)]
pub struct StructMemberInfo {
    #[wasm_bindgen(readonly)]
    pub name: String,
    #[wasm_bindgen(readonly)]
    pub type_name: String,
    #[wasm_bindgen(readonly)]
    pub offset: u32,
}

#[wasm_bindgen]
impl StructMemberInfo {
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

// ============================================================================
// Reflection Implementation
// ============================================================================

/// Reflects WGSL shader and returns detailed information about entry points,
/// bindings, inputs/outputs, and type definitions.
#[wasm_bindgen(js_name = reflectWgsl)]
pub fn reflect_wgsl(wgsl: &str) -> Result<ReflectionData, JsValue> {
    let (module, _info) = parse_and_validate(wgsl)?;

    let mut entry_points = Vec::new();

    for entry in &module.entry_points {
        let stage = match entry.stage {
            naga::ShaderStage::Vertex => "vertex",
            naga::ShaderStage::Fragment => "fragment",
            naga::ShaderStage::Compute => "compute",
            naga::ShaderStage::Task => "task",
            naga::ShaderStage::Mesh => "mesh",
        };

        let workgroup_size = if entry.stage == naga::ShaderStage::Compute {
            Some(vec![
                entry.workgroup_size[0],
                entry.workgroup_size[1],
                entry.workgroup_size[2],
            ])
        } else {
            None
        };

        // Collect bindings
        let mut bindings = Vec::new();
        for (handle, var) in module.global_variables.iter() {
            if let Some(binding) = &var.binding {
                // Check if this entry point uses this global
                if entry.function.expressions.iter().any(
                    |(_, expr)| matches!(expr, naga::Expression::GlobalVariable(h) if *h == handle),
                ) {
                    let (resource_type, type_name) = classify_binding(&module, var);

                    bindings.push(BindingInfo {
                        name: var.name.clone().unwrap_or_else(|| {
                            format!("binding_{}_{}", binding.group, binding.binding)
                        }),
                        group: binding.group,
                        binding: binding.binding,
                        resource_type,
                        type_name,
                    });
                }
            }
        }

        // Collect vertex inputs
        let mut vertex_inputs = Vec::new();
        if entry.stage == naga::ShaderStage::Vertex {
            for arg in &entry.function.arguments {
                if let Some(naga::Binding::Location { location, .. }) = arg.binding {
                    let type_name = get_type_name(&module, arg.ty);
                    vertex_inputs.push(VertexInputInfo {
                        name: arg
                            .name
                            .clone()
                            .unwrap_or_else(|| format!("input_{}", location)),
                        location,
                        type_name: type_name.unwrap_or_else(|| "unknown".to_string()),
                    });
                }
            }
        }

        // Collect fragment outputs
        let mut fragment_outputs = Vec::new();
        if entry.stage == naga::ShaderStage::Fragment {
            if let Some(ref result) = entry.function.result {
                match &result.binding {
                    Some(naga::Binding::Location { location, .. }) => {
                        let type_name = get_type_name(&module, result.ty);
                        fragment_outputs.push(FragmentOutputInfo {
                            name: "output".to_string(),
                            location: *location,
                            type_name: type_name.unwrap_or_else(|| "unknown".to_string()),
                        });
                    }
                    _ => {
                        // Check if return type is a struct with location bindings
                        if let naga::TypeInner::Struct { ref members, .. } =
                            module.types[result.ty].inner
                        {
                            for member in members {
                                if let Some(naga::Binding::Location { location, .. }) =
                                    member.binding
                                {
                                    let type_name = get_type_name(&module, member.ty);
                                    fragment_outputs.push(FragmentOutputInfo {
                                        name: member
                                            .name
                                            .clone()
                                            .unwrap_or_else(|| format!("output_{}", location)),
                                        location,
                                        type_name: type_name
                                            .unwrap_or_else(|| "unknown".to_string()),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        entry_points.push(EntryPointInfo {
            name: entry.name.clone(),
            stage: stage.to_string(),
            workgroup_size,
            bindings,
            vertex_inputs,
            fragment_outputs,
        });
    }

    // Collect type information (structs mainly)
    let mut types = Vec::new();
    for (handle, ty) in module.types.iter() {
        if let naga::TypeInner::Struct { ref members, .. } = ty.inner {
            let mut struct_members = Vec::new();
            for member in members {
                let type_name = get_type_name(&module, member.ty);
                struct_members.push(StructMemberInfo {
                    name: member.name.clone().unwrap_or_else(|| "unnamed".to_string()),
                    type_name: type_name.unwrap_or_else(|| "unknown".to_string()),
                    offset: member.offset,
                });
            }

            types.push(TypeInfo {
                name: ty
                    .name
                    .clone()
                    .unwrap_or_else(|| format!("type_{:?}", handle)),
                kind: "struct".to_string(),
                members: Some(struct_members),
            });
        }
    }

    Ok(ReflectionData {
        entry_points,
        types,
    })
}

/// Classify a binding's resource type and get its type name
fn classify_binding(
    module: &Module,
    var: &naga::GlobalVariable,
) -> (String, Option<String>) {
    use naga::TypeInner;

    let ty = &module.types[var.ty];
    let type_name = get_type_name(module, var.ty);

    let resource_type = match ty.inner {
        // Uniform buffer
        TypeInner::Struct { .. } if var.space == naga::AddressSpace::Uniform => "uniform",

        // Storage buffer
        TypeInner::Struct { .. } if matches!(var.space, naga::AddressSpace::Storage { .. }) => "storage",

        // Texture types
        TypeInner::Image { .. } => "texture",

        // Sampler
        TypeInner::Sampler { .. } => "sampler",

        // Atomic types
        TypeInner::Atomic { .. } => "atomic",

        // Scalar types (e.g., var<uniform> quad_color: vec4<f32>)
        TypeInner::Scalar { .. } if var.space == naga::AddressSpace::Uniform => "uniform",
        TypeInner::Scalar { .. } if matches!(var.space, naga::AddressSpace::Storage { .. }) => "storage",

        // Vector types (e.g., var<uniform> quad_color: vec4<f32>)
        TypeInner::Vector { .. } if var.space == naga::AddressSpace::Uniform => "uniform",
        TypeInner::Vector { .. } if matches!(var.space, naga::AddressSpace::Storage { .. }) => "storage",

        // Matrix types
        TypeInner::Matrix { .. } if var.space == naga::AddressSpace::Uniform => "uniform",
        TypeInner::Matrix { .. } if matches!(var.space, naga::AddressSpace::Storage { .. }) => "storage",

        // Array types
        TypeInner::Array { .. } if var.space == naga::AddressSpace::Uniform => "uniform",
        TypeInner::Array { .. } if matches!(var.space, naga::AddressSpace::Storage { .. }) => "storage",

        // Binding arrays (arrays of textures, samplers, etc.)
        TypeInner::BindingArray { .. } => "binding_array",

        // Acceleration structures (for ray tracing)
        TypeInner::AccelerationStructure { .. } => "acceleration_structure",

        // Ray queries
        TypeInner::RayQuery { .. } => "ray_query",

        // Pointer types (shouldn't normally appear in bindings, but handle them)
        TypeInner::Pointer { .. } => "pointer",

        // Fallback
        _ => "unknown",
    };

    (resource_type.to_string(), type_name)
}

/// Get a complete type name for any Naga type
fn get_type_name(module: &Module, handle: naga::Handle<naga::Type>) -> Option<String> {
    let ty = &module.types[handle];

    // If the type has an explicit name, use it
    if let Some(ref name) = ty.name {
        return Some(name.clone());
    }

    // Otherwise, generate a descriptive name based on the TypeInner variant
    Some(match ty.inner {
        naga::TypeInner::Scalar(scalar) => format_scalar(scalar),

        naga::TypeInner::Vector { size, scalar } => {
            let scalar_suffix = scalar_suffix(scalar);
            format!("vec{}{}", size as u8, scalar_suffix)
        }

        naga::TypeInner::Matrix {
            columns,
            rows,
            scalar,
        } => {
            let scalar_suffix = scalar_suffix(scalar);
            format!("mat{}x{}{}", columns as u8, rows as u8, scalar_suffix)
        }

        naga::TypeInner::Atomic(scalar) => {
            format!("atomic<{}>", format_scalar(scalar))
        }

        naga::TypeInner::Pointer { base, space } => {
            let base_name = get_type_name(module, base)?;
            let space_name = match space {
                naga::AddressSpace::Function => "function",
                naga::AddressSpace::Private => "private",
                naga::AddressSpace::WorkGroup => "workgroup",
                naga::AddressSpace::Uniform => "uniform",
                naga::AddressSpace::Storage { .. } => "storage",
                naga::AddressSpace::Handle => "handle",
                naga::AddressSpace::PushConstant => "push_constant",
            };
            format!("ptr<{}, {}>", space_name, base_name)
        }

        naga::TypeInner::ValuePointer {
            size,
            scalar,
            space,
        } => {
            let space_name = match space {
                naga::AddressSpace::Function => "function",
                naga::AddressSpace::Private => "private",
                naga::AddressSpace::WorkGroup => "workgroup",
                naga::AddressSpace::Uniform => "uniform",
                naga::AddressSpace::Storage { .. } => "storage",
                naga::AddressSpace::Handle => "handle",
                naga::AddressSpace::PushConstant => "push_constant",
            };
            let scalar_suffix = scalar_suffix(scalar);
            match size {
                Some(vec_size) => {
                    format!("ptr<{}, vec{}{}>", space_name, vec_size as u8, scalar_suffix)
                }
                None => {
                    format!("ptr<{}, {}>", space_name, format_scalar(scalar))
                }
            }
        }

        naga::TypeInner::Array { base, size, .. } => {
            let base_name = get_type_name(module, base)?;
            match size {
                naga::ArraySize::Constant(size_val) => {
                    format!("array<{}, {}>", base_name, size_val.get())
                }
                naga::ArraySize::Pending(_) => {
                    // Override-based size - can't determine at compile time
                    format!("array<{}>", base_name)
                }
                naga::ArraySize::Dynamic => format!("array<{}>", base_name),
            }
        }

        naga::TypeInner::Struct { .. } => "struct".to_string(),

        naga::TypeInner::Image {
            dim,
            arrayed,
            class,
        } => {
            let dim_str = match dim {
                naga::ImageDimension::D1 => "1d",
                naga::ImageDimension::D2 => "2d",
                naga::ImageDimension::D3 => "3d",
                naga::ImageDimension::Cube => "cube",
            };
            let array_str = if arrayed { "_array" } else { "" };
            let class_str = match class {
                naga::ImageClass::Sampled { multi: true, .. } => "_multisampled",
                naga::ImageClass::Depth { .. } => "_depth",
                naga::ImageClass::Storage { .. } => "_storage",
                _ => "",
            };
            format!("texture_{}{}{}", dim_str, array_str, class_str)
        }

        naga::TypeInner::Sampler { comparison } => {
            if comparison {
                "sampler_comparison".to_string()
            } else {
                "sampler".to_string()
            }
        }

        naga::TypeInner::AccelerationStructure { .. } => {
            "acceleration_structure".to_string()
        }

        naga::TypeInner::RayQuery { .. } => {
            "ray_query".to_string()
        }

        naga::TypeInner::BindingArray { base, size } => {
            let base_name = get_type_name(module, base)?;
            match size {
                naga::ArraySize::Constant(size_val) => {
                    format!("binding_array<{}, {}>", base_name, size_val.get())
                }
                naga::ArraySize::Pending(_) => {
                    // Override-based size - can't determine at compile time
                    format!("binding_array<{}>", base_name)
                }
                naga::ArraySize::Dynamic => format!("binding_array<{}>", base_name),
            }
        }
    })
}

/// Get the scalar type suffix for WGSL syntax
fn scalar_suffix(scalar: naga::Scalar) -> &'static str {
    match (scalar.kind, scalar.width) {
        (naga::ScalarKind::Float, 4) => "f",
        (naga::ScalarKind::Sint, 4) => "i",
        (naga::ScalarKind::Uint, 4) => "u",
        (naga::ScalarKind::Bool, _) => "b",
        (naga::ScalarKind::Float, 8) => "d",
        _ => "",
    }
}

/// Format a scalar type as its WGSL representation
fn format_scalar(scalar: naga::Scalar) -> String {
    match (scalar.kind, scalar.width) {
        (naga::ScalarKind::Float, 4) => "f32".to_string(),
        (naga::ScalarKind::Float, 8) => "f64".to_string(),
        (naga::ScalarKind::Float, 2) => "f16".to_string(),
        (naga::ScalarKind::Sint, 4) => "i32".to_string(),
        (naga::ScalarKind::Uint, 4) => "u32".to_string(),
        (naga::ScalarKind::Bool, _) => "bool".to_string(),
        (naga::ScalarKind::AbstractInt, _) => "abstract_int".to_string(),
        (naga::ScalarKind::AbstractFloat, _) => "abstract_float".to_string(),
        _ => format!("{:?}", scalar),
    }
}
