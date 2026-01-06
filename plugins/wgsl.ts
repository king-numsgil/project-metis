import { type OnLoadResultSourceCode, plugin, type PluginBuilder } from "bun";

import { reflectWgsl, wgslToSpirvBin, wgslToMsl } from "naga";
import {
    type GPUShaderCreateInfo,
    GPUShaderFormat,
    GPUShaderStage,
} from "sdl3";

plugin({
    name: "wgslLoader",
    target: "bun",
    setup(build: PluginBuilder): void {
        build.onLoad({filter: /\.wgsl$/}, async ({path}): Promise<OnLoadResultSourceCode | undefined> => {
            const source = await Bun.file(path).text();
            try {
                using reflect = reflectWgsl(source);
                const entrypoints: {
                    vertex: string | null,
                    fragment: string | null,
                    compute: string | null,
                } = {
                    vertex: null,
                    fragment: null,
                    compute: null,
                };

                // Map to store binding counts per entry point
                const bindingCounts = new Map<string, {
                    num_samplers: number;
                    num_storage_textures: number;
                    num_storage_buffers: number;
                    num_uniform_buffers: number;
                }>();

                for (const entrypoint of reflect.entry_points) {
                    const counts = {
                        num_samplers: 0,
                        num_storage_textures: 0,
                        num_storage_buffers: 0,
                        num_uniform_buffers: 0,
                    };

                    // Count bindings by type
                    for (const binding of entrypoint.bindings) {
                        if (binding.resource_type === "sampler") {
                            counts.num_samplers++;
                        } else if (binding.resource_type === "texture") {
                            // Check if it's a storage texture by looking at the type name
                            if (binding.type_name?.includes("storage")) {
                                counts.num_storage_textures++;
                            }
                        } else if (binding.resource_type === "storage") {
                            counts.num_storage_buffers++;
                        } else if (binding.resource_type === "uniform") {
                            counts.num_uniform_buffers++;
                        }
                    }

                    bindingCounts.set(entrypoint.name, counts);

                    if (entrypoint.stage === "vertex") {
                        entrypoints.vertex = entrypoint.name;
                    }
                    if (entrypoint.stage === "fragment") {
                        entrypoints.fragment = entrypoint.name;
                    }
                    if (entrypoint.stage === "compute") {
                        entrypoints.compute = entrypoint.name;
                    }
                }

                const lines: string[] = [];

                // Helper function to generate shader stage object
                const generateStage = (entrypoint: string | null, stage: string): string => {
                    if (entrypoint === null) {
                        return "null";
                    }

                    const spirv = wgslToSpirvBin(source, entrypoint);
                    const msl = Buffer.from(wgslToMsl(source, entrypoint));
                    const counts = bindingCounts.get(entrypoint)!;

                    const format = process.platform === "darwin" ? GPUShaderFormat.MSL : GPUShaderFormat.SPIRV;

                    const code = process.platform === "darwin" ? msl : spirv;
                    const codeBase64 = Buffer.from(code).toString("base64");

                    return `{
        code_size: ${code.byteLength},
        code: Buffer.from("${codeBase64}", "base64"),
        entrypoint: "${entrypoint}",
        format: ${format === GPUShaderFormat.MSL ? "GPUShaderFormat.MSL" : "GPUShaderFormat.SPIRV"},
        stage: ${stage === "vertex" ? "GPUShaderStage.Vertex" : stage === "fragment" ? "GPUShaderStage.Fragment" : "GPUShaderStage.Compute"},
        num_samplers: ${counts.num_samplers},
        num_storage_textures: ${counts.num_storage_textures},
        num_storage_buffers: ${counts.num_storage_buffers},
        num_uniform_buffers: ${counts.num_uniform_buffers},
    }`;
                };

                lines.push(`import {type GPUShaderCreateInfo, GPUShaderFormat, GPUShaderStage} from "sdl3";`);
                lines.push(`const vertex: GPUShaderCreateInfo | null = ${generateStage(entrypoints.vertex, "vertex")};`);
                lines.push(`const fragment: GPUShaderCreateInfo | null = ${generateStage(entrypoints.fragment, "fragment")};`);
                lines.push(`const compute: GPUShaderCreateInfo | null = ${generateStage(entrypoints.compute, "compute")};`);

                lines.push(`export default {vertex, fragment, compute};`);
                return {
                    loader: "ts",
                    contents: lines.join("\n"),
                };
            } catch (e) {
                console.error(`${path}\nWGSL Compilation Failed!`, e);
            }
        });
    },
});
