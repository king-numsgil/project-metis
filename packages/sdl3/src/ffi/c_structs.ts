import { alias, array, opaque, struct, union } from "koffi";

alias("SDL_PropertiesID", "uint32");
alias("SDL_DisplayID", "uint32");
alias("SDL_WindowFlags", "uint64");
alias("SDL_WindowID", "uint32");
opaque("SDL_Window");

alias("SDL_GPUShaderFormat", "uint32");
alias("SDL_GPUShaderStage", "uint32");
alias("SDL_GPULoadOp", "int");
alias("SDL_GPUStoreOp", "int");
alias("SDL_GPUBufferUsageFlags", "uint32");
alias("SDL_GPUTransferBufferUsage", "int");
alias("SDL_GPUFillMode", "int");
alias("SDL_GPUVertexInputRate", "int");
alias("SDL_GPUVertexElementFormat", "int");
alias("SDL_GPUStencilOp", "int");
alias("SDL_GPUCompareOp", "int");
alias("SDL_GPUBlendFactor", "int");
alias("SDL_GPUBlendOp", "int");
alias("SDL_GPUColorComponentFlags", "uint8");
alias("SDL_GPUCullMode", "int");
alias("SDL_GPUFrontFace", "int");
alias("SDL_GPUSampleCount", "int");
alias("SDL_GPUTextureFormat", "int");
alias("SDL_GPUPrimitiveType", "int");
opaque("SDL_GPUDevice");
opaque("SDL_GPUCommandBuffer");
opaque("SDL_GPUTexture");
opaque("SDL_GPURenderPass");
opaque("SDL_GPUBuffer");
opaque("SDL_GPUTransferBuffer");
opaque("SDL_GPUFence");
opaque("SDL_GPUCopyPass");
opaque("SDL_GPUShader");
opaque("SDL_GPUGraphicsPipeline");

export const SDL_Rect = struct("SDL_Rect", {
    x: "int",
    y: "int",
    w: "int",
    h: "int",
});

export const SDL_FRect = struct("SDL_FRect", {
    x: "float",
    y: "float",
    w: "float",
    h: "float",
});

// Common event structure
export const SDL_CommonEvent = struct("SDL_CommonEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64"
});

// Display event
export const SDL_DisplayEvent = struct("SDL_DisplayEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    displayID: "uint32",
    data1: "int32",
    data2: "int32"
});

// Window event
export const SDL_WindowEvent = struct("SDL_WindowEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    data1: "int32",
    data2: "int32"
});

// Keyboard device event
export const SDL_KeyboardDeviceEvent = struct("SDL_KeyboardDeviceEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32"
});

// Keyboard event
export const SDL_KeyboardEvent = struct("SDL_KeyboardEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    scancode: "uint32",
    key: "uint32",
    mod: "uint16",
    raw: "uint16",
    down: "bool",
    repeat: "bool"
});

// Text editing event
export const SDL_TextEditingEvent = struct("SDL_TextEditingEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    text: "const char*",
    start: "int32",
    length: "int32"
});

// Text editing candidates event
export const SDL_TextEditingCandidatesEvent = struct("SDL_TextEditingCandidatesEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    candidates: "const char**",
    num_candidates: "int32",
    selected_candidate: "int32",
    horizontal: "bool",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8"
});

// Text input event
export const SDL_TextInputEvent = struct("SDL_TextInputEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    text: "const char*"
});

// Mouse device event
export const SDL_MouseDeviceEvent = struct("SDL_MouseDeviceEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32"
});

// Mouse motion event
export const SDL_MouseMotionEvent = struct("SDL_MouseMotionEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    state: "uint32",
    x: "float",
    y: "float",
    xrel: "float",
    yrel: "float"
});

// Mouse button event
export const SDL_MouseButtonEvent = struct("SDL_MouseButtonEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    button: "uint8",
    down: "bool",
    clicks: "uint8",
    padding: "uint8",
    x: "float",
    y: "float"
});

// Mouse wheel event
export const SDL_MouseWheelEvent = struct("SDL_MouseWheelEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    x: "float",
    y: "float",
    direction: "uint32",
    mouse_x: "float",
    mouse_y: "float",
    integer_x: "int32",
    integer_y: "int32"
});

// Joystick axis event
export const SDL_JoyAxisEvent = struct("SDL_JoyAxisEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    axis: "uint8",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8",
    value: "int16",
    padding4: "uint16"
});

// Joystick ball event
export const SDL_JoyBallEvent = struct("SDL_JoyBallEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    ball: "uint8",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8",
    xrel: "int16",
    yrel: "int16"
});

// Joystick hat event
export const SDL_JoyHatEvent = struct("SDL_JoyHatEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    hat: "uint8",
    value: "uint8",
    padding1: "uint8",
    padding2: "uint8"
});

// Joystick button event
export const SDL_JoyButtonEvent = struct("SDL_JoyButtonEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    button: "uint8",
    down: "bool",
    padding1: "uint8",
    padding2: "uint8"
});

// Joystick device event
export const SDL_JoyDeviceEvent = struct("SDL_JoyDeviceEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32"
});

// Joystick battery event
export const SDL_JoyBatteryEvent = struct("SDL_JoyBatteryEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    state: "int32",
    percent: "int32"
});

// Gamepad axis event
export const SDL_GamepadAxisEvent = struct("SDL_GamepadAxisEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    axis: "uint8",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8",
    value: "int16",
    padding4: "uint16"
});

// Gamepad button event
export const SDL_GamepadButtonEvent = struct("SDL_GamepadButtonEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    button: "uint8",
    down: "bool",
    padding1: "uint8",
    padding2: "uint8"
});

// Gamepad device event
export const SDL_GamepadDeviceEvent = struct("SDL_GamepadDeviceEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32"
});

// Gamepad touchpad event
export const SDL_GamepadTouchpadEvent = struct("SDL_GamepadTouchpadEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    touchpad: "int32",
    finger: "int32",
    x: "float",
    y: "float",
    pressure: "float"
});

// Gamepad sensor event
export const SDL_GamepadSensorEvent = struct("SDL_GamepadSensorEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    sensor: "int32",
    data: array("float", 3),
    sensor_timestamp: "uint64"
});

// Audio device event
export const SDL_AudioDeviceEvent = struct("SDL_AudioDeviceEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    recording: "bool",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8"
});

// Camera device event
export const SDL_CameraDeviceEvent = struct("SDL_CameraDeviceEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32"
});

// Render event
export const SDL_RenderEvent = struct("SDL_RenderEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32"
});

// Touch finger event
export const SDL_TouchFingerEvent = struct("SDL_TouchFingerEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    touchID: "uint64",
    fingerID: "uint64",
    x: "float",
    y: "float",
    dx: "float",
    dy: "float",
    pressure: "float",
    windowID: "uint32"
});

// Pen proximity event
export const SDL_PenProximityEvent = struct("SDL_PenProximityEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32"
});

// Pen motion event
export const SDL_PenMotionEvent = struct("SDL_PenMotionEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    pen_state: "uint32",
    x: "float",
    y: "float"
});

// Pen touch event
export const SDL_PenTouchEvent = struct("SDL_PenTouchEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    pen_state: "uint32",
    x: "float",
    y: "float",
    eraser: "bool",
    down: "bool"
});

// Pen button event
export const SDL_PenButtonEvent = struct("SDL_PenButtonEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    pen_state: "uint32",
    x: "float",
    y: "float",
    button: "uint8",
    down: "bool"
});

// Pen axis event
export const SDL_PenAxisEvent = struct("SDL_PenAxisEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    which: "uint32",
    pen_state: "uint32",
    x: "float",
    y: "float",
    axis: "int32",
    value: "float"
});

// Drop event
export const SDL_DropEvent = struct("SDL_DropEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    x: "float",
    y: "float",
    source: "const char*",
    data: "const char*"
});

// Clipboard event
export const SDL_ClipboardEvent = struct("SDL_ClipboardEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    owner: "bool",
    num_mime_types: "int32",
    mime_types: "const char**"
});

// Sensor event
export const SDL_SensorEvent = struct("SDL_SensorEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    which: "uint32",
    data: array("float", 6),
    sensor_timestamp: "uint64"
});

// Quit event
export const SDL_QuitEvent = struct("SDL_QuitEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64"
});

// User event
export const SDL_UserEvent = struct("SDL_UserEvent", {
    type: "uint32",
    reserved: "uint32",
    timestamp: "uint64",
    windowID: "uint32",
    code: "int32",
    data1: "void*",
    data2: "void*"
});

// Main event union
export const SDL_Event = union("SDL_Event", {
    type: "uint32",
    common: SDL_CommonEvent,
    display: SDL_DisplayEvent,
    window: SDL_WindowEvent,
    kdevice: SDL_KeyboardDeviceEvent,
    key: SDL_KeyboardEvent,
    edit: SDL_TextEditingEvent,
    edit_candidates: SDL_TextEditingCandidatesEvent,
    text: SDL_TextInputEvent,
    mdevice: SDL_MouseDeviceEvent,
    motion: SDL_MouseMotionEvent,
    button: SDL_MouseButtonEvent,
    wheel: SDL_MouseWheelEvent,
    jdevice: SDL_JoyDeviceEvent,
    jaxis: SDL_JoyAxisEvent,
    jball: SDL_JoyBallEvent,
    jhat: SDL_JoyHatEvent,
    jbutton: SDL_JoyButtonEvent,
    jbattery: SDL_JoyBatteryEvent,
    gdevice: SDL_GamepadDeviceEvent,
    gaxis: SDL_GamepadAxisEvent,
    gbutton: SDL_GamepadButtonEvent,
    gtouchpad: SDL_GamepadTouchpadEvent,
    gsensor: SDL_GamepadSensorEvent,
    adevice: SDL_AudioDeviceEvent,
    cdevice: SDL_CameraDeviceEvent,
    sensor: SDL_SensorEvent,
    quit: SDL_QuitEvent,
    user: SDL_UserEvent,
    tfinger: SDL_TouchFingerEvent,
    pproximity: SDL_PenProximityEvent,
    ptouch: SDL_PenTouchEvent,
    pmotion: SDL_PenMotionEvent,
    pbutton: SDL_PenButtonEvent,
    paxis: SDL_PenAxisEvent,
    render: SDL_RenderEvent,
    drop: SDL_DropEvent,
    clipboard: SDL_ClipboardEvent,
    padding: array("uint8", 128)
});

export const SDL_FColor = struct("SDL_FColor", {
    r: "float",
    g: "float",
    b: "float",
    a: "float",
});

export const SDL_GPUColorTargetInfo = struct("SDL_GPUColorTargetInfo", {
    texture: "SDL_GPUTexture*",
    mip_level: "uint32",
    layer_or_depth_plane: "uint32",
    clear_color: SDL_FColor,
    load_op: "SDL_GPULoadOp",
    store_op: "SDL_GPUStoreOp",
    resolve_texture: "SDL_GPUTexture*",
    resolve_mip_level: "uint32",
    resolve_layer: "uint32",
    cycle: "bool",
    cycle_resolve_texture: "bool",
    padding1: "uint8",
    padding2: "uint8",
});

export const SDL_GPUDepthStencilTargetInfo = struct("SDL_GPUDepthStencilTargetInfo", {
    texture: "SDL_GPUTexture*",
    clear_depth: "float",
    load_op: "SDL_GPULoadOp",
    store_op: "SDL_GPUStoreOp",
    stencil_load_op: "SDL_GPULoadOp",
    stencil_store_op: "SDL_GPUStoreOp",
    cycle: "bool",
    clear_stencil: "uint8",
    padding1: "uint8",
    padding2: "uint8",
});

export const SDL_GPUBufferCreateInfo = struct("SDL_GPUBufferCreateInfo", {
    usage: "SDL_GPUBufferUsageFlags",
    size: "uint32",
    props: "SDL_PropertiesID",
});

export const SDL_GPUTransferBufferCreateInfo = struct("SDL_GPUTransferBufferCreateInfo", {
    usage: "SDL_GPUTransferBufferUsage",
    size: "uint32",
    props: "SDL_PropertiesID",
});

export const SDL_GPUBufferLocation = struct("SDL_GPUBufferLocation", {
    buffer: "SDL_GPUBuffer*",
    offset: "uint32",
});

export const SDL_GPUTransferBufferLocation = struct("SDL_GPUTransferBufferLocation", {
    transfer_buffer: "SDL_GPUTransferBuffer*",
    offset: "uint32",
});

export const SDL_GPUBufferRegion = struct("SDL_GPUBufferRegion", {
    buffer: "SDL_GPUBuffer*",
    offset: "uint32",
    size: "uint32",
});

export const SDL_GPUVertexBufferDescription = struct("SDL_GPUVertexBufferDescription", {
    slot: "uint32",
    pitch: "uint32",
    input_rate: "SDL_GPUVertexInputRate",
    instance_step_rate: "uint32",
});

export const SDL_GPUVertexAttribute = struct("SDL_GPUVertexAttribute", {
    location: "uint32",
    buffer_slot: "uint32",
    format: "SDL_GPUVertexElementFormat",
    offset: "uint32",
});

export const SDL_GPUVertexInputState = struct("SDL_GPUVertexInputState", {
    vertex_buffer_descriptions: "const SDL_GPUVertexBufferDescription*",
    num_vertex_buffers: "uint32",
    vertex_attributes: "const SDL_GPUVertexAttribute*",
    num_vertex_attributes: "uint32",
});

export const SDL_GPUStencilOpState = struct("SDL_GPUStencilOpState", {
    fail_op: "SDL_GPUStencilOp",
    pass_op: "SDL_GPUStencilOp",
    depth_fail_op: "SDL_GPUStencilOp",
    compare_op: "SDL_GPUCompareOp",
});

export const SDL_GPUColorTargetBlendState = struct("SDL_GPUColorTargetBlendState", {
    src_color_blendfactor: "SDL_GPUBlendFactor",
    dst_color_blendfactor: "SDL_GPUBlendFactor",
    color_blend_op: "SDL_GPUBlendOp",
    src_alpha_blendfactor: "SDL_GPUBlendFactor",
    dst_alpha_blendfactor: "SDL_GPUBlendFactor",
    alpha_blend_op: "SDL_GPUBlendOp",
    color_write_mask: "SDL_GPUColorComponentFlags",
    enable_blend: "bool",
    enable_color_write_mask: "bool",
    padding1: "uint8",
    padding2: "uint8",
});

export const SDL_GPUShaderCreateInfo = struct("SDL_GPUShaderCreateInfo", {
    code_size: "uint64",
    code: "const uint8*",
    entrypoint: "const char*",
    format: "SDL_GPUShaderFormat",
    stage: "SDL_GPUShaderStage",
    num_samplers: "uint32",
    num_storage_textures: "uint32",
    num_storage_buffers: "uint32",
    num_uniform_buffers: "uint32",
    props: "SDL_PropertiesID",
});

export const SDL_GPURasterizerState = struct("SDL_GPURasterizerState", {
    fill_mode: "SDL_GPUFillMode",
    cull_mode: "SDL_GPUCullMode",
    front_face: "SDL_GPUFrontFace",
    depth_bias_constant_factor: "float",
    depth_bias_clamp: "float",
    depth_bias_slope_factor: "float",
    enable_depth_bias: "bool",
    enable_depth_clip: "bool",
    padding1: "uint8",
    padding2: "uint8",
});

export const SDL_GPUMultisampleState = struct("SDL_GPUMultisampleState", {
    sample_count: "SDL_GPUSampleCount",
    sample_mask: "uint32",
    enable_mask: "bool",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8",
});

export const SDL_GPUDepthStencilState = struct("SDL_GPUDepthStencilState", {
    compare_op: "SDL_GPUCompareOp",
    back_stencil_state: SDL_GPUStencilOpState,
    front_stencil_state: SDL_GPUStencilOpState,
    compare_mask: "uint8",
    write_mask: "uint8",
    enable_depth_test: "bool",
    enable_depth_write: "bool",
    enable_stencil_test: "bool",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8",
});

export const SDL_GPUColorTargetDescription = struct("SDL_GPUColorTargetDescription", {
    format: "SDL_GPUTextureFormat",
    blend_state: SDL_GPUColorTargetBlendState,
});

export const SDL_GPUGraphicsPipelineTargetInfo = struct("SDL_GPUGraphicsPipelineTargetInfo", {
    color_target_descriptions: "const SDL_GPUColorTargetDescription*",
    num_color_targets: "uint32",
    depth_stencil_format: "SDL_GPUTextureFormat",
    has_depth_stencil_target: "bool",
    padding1: "uint8",
    padding2: "uint8",
    padding3: "uint8",
});

export const SDL_GPUGraphicsPipelineCreateInfo = struct("SDL_GPUGraphicsPipelineCreateInfo", {
    vertex_shader: "SDL_GPUShader*",
    fragment_shader: "SDL_GPUShader*",
    vertex_input_state: SDL_GPUVertexInputState,
    primitive_type: "SDL_GPUPrimitiveType",
    rasterizer_state: SDL_GPURasterizerState,
    multisample_state: SDL_GPUMultisampleState,
    depth_stencil_state: SDL_GPUDepthStencilState,
    target_info: SDL_GPUGraphicsPipelineTargetInfo,
    props: "SDL_PropertiesID",
});

export const SDL_GPUBufferBinding = struct("SDL_GPUBufferBinding", {
    buffer: "SDL_GPUBuffer*",
    offset: "uint32",
});
