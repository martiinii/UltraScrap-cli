import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import prettyBytes from "pretty-bytes";

type CopyFilesOptions = {
  pattern: string;
  outdir: string;
  baseDir?: string;
  msgName?: string;
};
export const copyFiles = async ({
  pattern,
  outdir,
  baseDir,
  msgName,
}: CopyFilesOptions) => {
  const glob = new Bun.Glob(pattern);
  let fileCount = 0;

  for await (const filePath of glob.scan({ cwd: baseDir, dot: true })) {
    fileCount++;
    const file = Bun.file(path.join(baseDir || ".", filePath));

    const outputPath = path.join(outdir, filePath);

    await Bun.write(outputPath, file);
  }

  if (msgName) {
    console.log(
      chalk.green(
        `  - Copied ${chalk.yellow(fileCount)} file(s) ${chalk.blue(`(${msgName})`)}`,
      ),
    );
  }
};

export const prettyPrintBunBuildArtifact = (artifact: Bun.BuildArtifact) => {
  const size = prettyBytes(artifact.size);
  const fileName = path.basename(artifact.path);

  console.log(
    chalk.green(
      `  - Bundled ${chalk.magenta(fileName)} ${chalk.yellow(`(${size})`)}`,
    ),
  );
};

// Clean up previous build directory
await rm("../build", {
  recursive: true,
  force: true,
});

// Build the CLI
const result = await Bun.build({
  entrypoints: ["index.tsx"],
  outdir: "../build/dist",
  target: "node",
  minify: {
    syntax: true,
    whitespace: true,
  },
  banner: "#!/usr/bin/env node",
});

for (const output of result.outputs) {
  prettyPrintBunBuildArtifact(output);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create package.json and README for the build
type PackageJson = {
  name: string;
  description: string;
  version: string;
  keywords: string[];
  repository: {
    type: string;
    url: string;
  };
  license: string;
  homepage: string;
};
const packageJsonString = await readFile(
  path.join(__dirname, "..", "package.json"),
  "utf8",
);
const packageJson: PackageJson = JSON.parse(packageJsonString);

const packageJsonBuild = {
  name: packageJson.name,
  description: packageJson.description,
  version: packageJson.version,
  type: "module",
  keywords: packageJson.keywords,
  repository: packageJson.repository,
  license: packageJson.license,
  homepage: packageJson.homepage,
  bin: {
    ultrastar: "./dist/index.js",
  },
};

await mkdir("../build", { recursive: true });
await writeFile(
  "../build/package.json",
  JSON.stringify(packageJsonBuild, null, 2),
);
await copyFiles({
  pattern: "README.md",
  outdir: "../build",
  baseDir: "../",
  msgName: "README",
});

console.log(chalk.green("\nCLI Build completed successfully"));
