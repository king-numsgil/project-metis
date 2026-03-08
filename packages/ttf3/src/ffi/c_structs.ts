import { alias, opaque, struct } from "koffi";

// SDL types not present in sdl3 package
struct("SDL_FPoint", {
    x: "float",
    y: "float",
});

// TTF enum aliases
alias("TTF_FontStyleFlags", "uint32");
alias("TTF_HintingFlags", "int");
alias("TTF_HorizontalAlignment", "int");
alias("TTF_Direction", "int");
alias("TTF_ImageType", "int");
alias("TTF_GPUTextEngineWinding", "int");
alias("TTF_SubStringFlags", "uint32");

// Opaque TTF types
opaque("TTF_Font");
opaque("TTF_TextEngine");
opaque("TTF_TextData");

// TTF_Text has public fields accessible via decode()
struct("TTF_Text", {
    text: "char*",
    num_lines: "int",
    refcount: "int",
    internal: "TTF_TextData*",
});

// TTF_SubString embeds SDL_Rect (registered by sdl3/ffi import in lib.ts)
struct("TTF_SubString", {
    flags: "TTF_SubStringFlags",
    offset: "int",
    length: "int",
    line_index: "int",
    cluster_index: "int",
    rect: "SDL_Rect",
});

// TTF_GPUAtlasDrawSequence — linked list node; next is void* to avoid self-reference issues
struct("TTF_GPUAtlasDrawSequence", {
    atlas_texture: "SDL_GPUTexture*",
    xy: "SDL_FPoint*",
    uv: "SDL_FPoint*",
    num_vertices: "int",
    indices: "int*",
    num_indices: "int",
    image_type: "TTF_ImageType",
    next: "void*",
});
