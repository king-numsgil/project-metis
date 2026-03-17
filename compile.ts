import {wgslLoader} from "./plugins/wgsl.ts";

await Bun.build({
    entrypoints: ["./packages/metis-app/src/main.ts"],
    compile: {
        autoloadTsconfig: false,
        autoloadPackageJson: false,
        autoloadDotenv: true,
        autoloadBunfig: false,
        outfile: "./metis",
    },
    target: "bun",
    minify: true,
    bytecode: true,
    format: "esm",
    plugins: [
        wgslLoader,
    ],
});
