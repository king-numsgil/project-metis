# Metis Development Guide for AI Agents

This guide provides comprehensive instructions for AI agents working in the Metis graphics engine codebase.

## Build Commands

### Development
```bash
# Install dependencies
bun install

# Run the application directly
bun packages/metis-app/src/main.ts

# Build native executable
bun run compile
```

### WebAssembly Components
```bash
# Build shader compiler (in packages/naga)
cd packages/naga && bun run build
```

### Testing
- No automated test framework currently configured
- Manual testing via executable: `bun run compile && ./metis.exe`
- To test individual components: create test files in relevant packages and run directly with bun

## Project Structure

This is a **Bun monorepo** with workspace packages:

```
├── packages/
│   ├── metis-app/     # Main application entry point
│   ├── metis-data/    # GPU memory management and data structures  
│   ├── sdl3/         # SDL3 FFI bindings and GPU abstraction
│   └── naga/         # WebAssembly shader compilation (Rust)
├── plugins/          # Bun plugins (WGSL compilation)
└── types/           # TypeScript definitions
```

## Code Style Guidelines

### Imports
- Use ES6 imports exclusively
- Separate type imports with `type` keyword for tree-shaking
- Use workspace path aliases: `"metis-data"`, `"sdl3"`, `"naga"`
- Import order: 1) External libs, 2) Workspace packages, 3) Relative imports

```typescript
import { Device, Window, System } from "sdl3";
import { Vec, F32, StructOf } from "metis-data";
import type { GPUTextureFormat } from "sdl3";
import { localHelper } from "./utils";
```

### Naming Conventions
- **PascalCase** for classes, types, and enums (`System`, `Window`, `GPUPrimitiveType`)
- **camelCase** for variables and functions (`createDevice`, `handleEvent`)
- **UPPER_SNAKE_CASE** for constants and enum members (`GPU_FILTER_LINEAR`)
- Use descriptive, domain-specific names

### TypeScript Configuration
- **Strict mode enabled** with comprehensive type checking
- **Target**: ESNext with module preservation
- **Module resolution**: Bundler mode
- Use `using` statements for resource management where applicable

### Memory Management
- Use `using` statements for automatic resource disposal
- Implement explicit cleanup patterns for GPU resources
- Follow structured buffer layouts with proper alignment
- Consider GPU memory constraints when designing data structures

### GPU/Shader Patterns
- Use descriptor-based resource management
- Create comprehensive pipeline configuration objects
- Follow command buffer patterns for GPU operations
- Ensure proper synchronization between CPU and GPU operations

## Technology Stack

- **Runtime**: Bun (JavaScript runtime with native compilation)
- **Language**: TypeScript with strict configuration
- **Graphics**: WebGPU via SDL3 FFI bindings
- **Shaders**: WGSL (WebGPU Shading Language)
- **Native Integration**: koffi FFI library
- **Shader Compilation**: Naga WebAssembly (Rust)

## Development Practices

### Error Handling
- Use explicit error checking for FFI calls (`sdlGetError()`)
- Implement proper resource cleanup in error paths
- Use TypeScript's strict null checking
- Validate shader compilation results before use

### Performance Considerations
- Minimize CPU-GPU synchronization points
- Use typed memory management for GPU buffers
- Leverage WebAssembly for performance-critical operations
- Consider native compilation for deployment

### Code Organization
- Keep FFI bindings separate from high-level abstractions
- Organize GPU operations by logical pipeline stages
- Use clear separation between data structures and algorithms
- Maintain consistent resource naming across packages

## Working with GPU Resources

When creating GPU resources:
1. Always check for creation errors
2. Use appropriate usage flags for buffers/textures
3. Ensure proper memory alignment for structured data
4. Implement cleanup patterns for all GPU resources

When working with shaders:
1. Compile WGSL files through the build system (auto-loaded via plugin)
2. Validate shader modules before use
3. Handle compilation errors gracefully
4. Test shader compatibility across different GPU drivers

## Plugin System

The project uses Bun plugins for custom asset processing:
- WGSL shaders are compiled automatically via `./plugins/wgsl.ts`
- Shader modules are available as ESM imports with `.vertex`, `.fragment`, `.compute` properties

## Important File Patterns

- Main entry: `packages/metis-app/src/main.ts`
- Core systems: `packages/sdl3/src/` (FFI bindings + abstractions)
- Data structures: `packages/metis-data/src/` (GPU memory management)
- Type definitions: `types/wgsl.d.ts` (shader module types)
- WebAssembly: `packages/naga/wasm/` (compiled shader compiler)

## Common Pitfalls

- Don't forget to check FFI function return values
- Always dispose of GPU resources when done
- Remember that WebGPU validation errors are often asynchronous
- Be careful with buffer alignment and memory layout
- Test across different GPU drivers when possible

## Debugging

- Use `console.depth = 3` (configured in bunfig.toml) for better object inspection
- Enable SDL3 debugging environment variables if needed
- Use the built WebAssembly tools for shader debugging
- Consider visual debugging for graphics issues