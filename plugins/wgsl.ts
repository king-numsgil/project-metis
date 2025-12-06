import { type OnLoadResultSourceCode, plugin, type PluginBuilder } from "bun";

import { reflectWgsl, wgslToSpirvBin, wgslToMsl } from "naga";

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

                for (const entrypoint of reflect.entry_points) {
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

                if (entrypoints.vertex === null) {
                    lines.push(`const vertex = null;`);
                } else {
                    const spirv = Buffer.from(wgslToSpirvBin(source, entrypoints.vertex)).toString("base64");
                    const msl = Buffer.from(wgslToMsl(source, entrypoints.vertex)).toString("base64");
                    lines.push(`const vertex = {spirv: Buffer.from("${spirv}", "base64"), msl: Buffer.from("${msl}", "base64")};`);
                }

                if (entrypoints.fragment === null) {
                    lines.push(`const fragment = null;`);
                } else {
                    const spirv = Buffer.from(wgslToSpirvBin(source, entrypoints.fragment)).toString("base64");
                    const msl = Buffer.from(wgslToMsl(source, entrypoints.fragment)).toString("base64");
                    lines.push(`const fragment = {spirv: Buffer.from("${spirv}", "base64"), msl: Buffer.from("${msl}", "base64")};`);
                }

                if (entrypoints.compute === null) {
                    lines.push(`const compute = null;`);
                } else {
                    const spirv = Buffer.from(wgslToSpirvBin(source, entrypoints.compute)).toString("base64");
                    const msl = Buffer.from(wgslToMsl(source, entrypoints.compute)).toString("base64");
                    lines.push(`const compute = {spirv: Buffer.from("${spirv}", "base64"), msl: Buffer.from("${msl}", "base64")};`);
                }

                lines.push(`export default {vertex, fragment, compute};`);
                return {
                    loader: "js",
                    contents: lines.join("\n"),
                };
            } catch (e) {
                console.error(`${path}\nWGSL Compilation Failed!`, e);
            }
        });
    },
});
