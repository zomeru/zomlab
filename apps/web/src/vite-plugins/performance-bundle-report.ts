import type { Plugin } from "vite";

interface OutputChunkLike {
  code: string;
  fileName: string;
  imports: string[];
  isEntry: boolean;
  modules: Record<string, { renderedLength: number }>;
  type: "chunk";
}

interface OutputAssetLike {
  type: "asset";
}

type OutputBundleLike = Record<string, OutputAssetLike | OutputChunkLike>;

interface ChunkReport {
  bytes: number;
  fileName: string;
  initial: boolean;
  modules: number;
}

function dependencyName(moduleId: string): string | null {
  const marker = "/node_modules/";
  const markerIndex = moduleId.lastIndexOf(marker);
  if (markerIndex === -1) return null;
  const path = moduleId.slice(markerIndex + marker.length);
  const segments = path.split("/");
  const first = segments[0];
  if (!first) return null;
  if (first.startsWith("@")) {
    const second = segments[1];
    return second ? `${first}/${second}` : first;
  }
  return first;
}

function collectInitialChunks(chunks: Map<string, OutputChunkLike>) {
  const initial = new Set<string>();

  function visit(fileName: string) {
    if (initial.has(fileName)) return;
    const chunk = chunks.get(fileName);
    if (!chunk) return;
    initial.add(fileName);
    for (const imported of chunk.imports) visit(imported);
  }

  for (const chunk of chunks.values()) {
    if (chunk.isEntry) visit(chunk.fileName);
  }
  return initial;
}

function createReport(bundle: OutputBundleLike) {
  const chunks = new Map(
    Object.values(bundle)
      .filter((item): item is OutputChunkLike => item.type === "chunk")
      .map((chunk) => [chunk.fileName, chunk]),
  );
  const initialChunks = collectInitialChunks(chunks);
  const dependencyBytes = new Map<string, number>();
  const dependencyChunks = new Map<string, Set<string>>();
  const chunkReports: ChunkReport[] = [];

  for (const chunk of chunks.values()) {
    const bytes = new TextEncoder().encode(chunk.code).byteLength;
    chunkReports.push({
      bytes,
      fileName: chunk.fileName,
      initial: initialChunks.has(chunk.fileName),
      modules: Object.keys(chunk.modules).length,
    });

    for (const [moduleId, moduleInfo] of Object.entries(chunk.modules)) {
      const dependency = dependencyName(moduleId);
      if (!dependency) continue;
      dependencyBytes.set(
        dependency,
        (dependencyBytes.get(dependency) ?? 0) + moduleInfo.renderedLength,
      );
      const files = dependencyChunks.get(dependency) ?? new Set<string>();
      files.add(chunk.fileName);
      dependencyChunks.set(dependency, files);
    }
  }

  const dependencies = Array.from(dependencyBytes, ([name, bytes]) => ({
    bytes,
    chunkCount: dependencyChunks.get(name)?.size ?? 0,
    name,
  })).sort((left, right) => right.bytes - left.bytes);
  const sortedChunks = [...chunkReports].sort((left, right) => right.bytes - left.bytes);
  const initialBytes = chunkReports.reduce(
    (total, chunk) => total + (chunk.initial ? chunk.bytes : 0),
    0,
  );
  const totalBytes = chunkReports.reduce((total, chunk) => total + chunk.bytes, 0);

  return {
    asyncBytes: totalBytes - initialBytes,
    chunks: sortedChunks.slice(0, 12),
    dependencies: dependencies.slice(0, 12),
    duplicatedDependencies: dependencies
      .filter((dependency) => dependency.chunkCount > 1)
      .slice(0, 8),
    generatedAt: new Date().toISOString(),
    initialBytes,
    mode: process.env.CLOUDFLARE_ENV ?? "production",
    totalBytes,
  };
}

export function performanceBundleReport(): Plugin {
  return {
    apply: "build",
    generateBundle(_options, bundle) {
      if (!Object.values(bundle).some((item) => item.type === "chunk")) return;
      this.emitFile({
        fileName: "performance-bundle-report.json",
        source: JSON.stringify(createReport(bundle), null, 2),
        type: "asset",
      });
    },
    name: "zomlab-performance-bundle-report",
  };
}
