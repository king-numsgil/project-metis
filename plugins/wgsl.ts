import { type OnLoadResultSourceCode, plugin, type PluginBuilder } from "bun";

import { reflectWgsl, wgslToSpirvBin } from "naga";

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
                    num_readonly_storage_textures: number;
                    num_readonly_storage_buffers: number;
                    num_readwrite_storage_textures: number;
                    num_readwrite_storage_buffers: number;
                    num_uniform_buffers: number;
                }>();

                // Map to store workgroup sizes for compute shaders
                const workgroupSizes = new Map<string, {
                    threadcount_x: number;
                    threadcount_y: number;
                    threadcount_z: number;
                }>();

                for (const entrypoint of reflect.entry_points) {
                    const counts = {
                        num_samplers: 0,
                        num_readonly_storage_textures: 0,
                        num_readonly_storage_buffers: 0,
                        num_readwrite_storage_textures: 0,
                        num_readwrite_storage_buffers: 0,
                        num_uniform_buffers: 0,
                    };

                    // Count bindings by type and access mode
                    for (const binding of entrypoint.bindings) {
                        if (binding.resource_type === "sampler") {
                            counts.num_samplers++;
                        } else if (binding.resource_type === "storage_texture") {
                            if (binding.is_readonly) {
                                counts.num_readonly_storage_textures++;
                            } else {
                                counts.num_readwrite_storage_textures++;
                            }
                        } else if (binding.resource_type === "storage") {
                            if (binding.is_readonly) {
                                counts.num_readonly_storage_buffers++;
                            } else {
                                counts.num_readwrite_storage_buffers++;
                            }
                        } else if (binding.resource_type === "uniform") {
                            counts.num_uniform_buffers++;
                        }
                    }

                    bindingCounts.set(entrypoint.name, counts);

                    // Store workgroup size for compute shaders
                    if (entrypoint.stage === "compute" && entrypoint.workgroup_size) {
                        workgroupSizes.set(entrypoint.name, {
                            threadcount_x: entrypoint.workgroup_size[0]!,
                            threadcount_y: entrypoint.workgroup_size[1]!,
                            threadcount_z: entrypoint.workgroup_size[2]!,
                        });
                    }

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

                // Helper function to generate shader stage object for graphics pipeline
                const generateGraphicsStage = (entrypoint: string | null, stage: string): string => {
                    if (entrypoint === null) {
                        return "null";
                    }

                    const spirv = wgslToSpirvBin(source, entrypoint);
                    const counts = bindingCounts.get(entrypoint)!;
                    const codeBase64 = Buffer.from(spirv).toString("base64");

                    return `{
        code_size: ${spirv.byteLength},
        code: Buffer.from("${codeBase64}", "base64"),
        entrypoint: "${entrypoint}",
        format: GPUShaderFormat.SPIRV,
        stage: ${stage === "vertex" ? "GPUShaderStage.Vertex" : "GPUShaderStage.Fragment"},
        num_samplers: ${counts.num_samplers},
        num_storage_textures: ${counts.num_readonly_storage_textures + counts.num_readwrite_storage_textures},
        num_storage_buffers: ${counts.num_readonly_storage_buffers + counts.num_readwrite_storage_buffers},
        num_uniform_buffers: ${counts.num_uniform_buffers},
    }`;
                };

                // Helper function to generate compute pipeline object
                const generateComputeStage = (entrypoint: string | null): string => {
                    if (entrypoint === null) {
                        return "null";
                    }

                    const spirv = wgslToSpirvBin(source, entrypoint);
                    const counts = bindingCounts.get(entrypoint)!;
                    const workgroup = workgroupSizes.get(entrypoint)!;
                    const codeBase64 = Buffer.from(spirv).toString("base64");

                    return `{
        code_size: ${spirv.byteLength},
        code: Buffer.from("${codeBase64}", "base64"),
        entrypoint: "${entrypoint}",
        format: GPUShaderFormat.SPIRV,
        num_samplers: ${counts.num_samplers},
        num_readonly_storage_textures: ${counts.num_readonly_storage_textures},
        num_readonly_storage_buffers: ${counts.num_readonly_storage_buffers},
        num_readwrite_storage_textures: ${counts.num_readwrite_storage_textures},
        num_readwrite_storage_buffers: ${counts.num_readwrite_storage_buffers},
        num_uniform_buffers: ${counts.num_uniform_buffers},
        threadcount_x: ${workgroup.threadcount_x},
        threadcount_y: ${workgroup.threadcount_y},
        threadcount_z: ${workgroup.threadcount_z},
    }`;
                };

                lines.push(`import {type GPUShaderCreateInfo, type GPUComputePipelineCreateInfo, GPUShaderFormat, GPUShaderStage} from "sdl3";`);
                lines.push(`const vertex: GPUShaderCreateInfo | null = ${generateGraphicsStage(entrypoints.vertex, "vertex")};`);
                lines.push(`const fragment: GPUShaderCreateInfo | null = ${generateGraphicsStage(entrypoints.fragment, "fragment")};`);
                lines.push(`const compute: GPUComputePipelineCreateInfo | null = ${generateComputeStage(entrypoints.compute)};`);

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
