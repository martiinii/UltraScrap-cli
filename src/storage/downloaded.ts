import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";

export type DownloadedEntry = {
  apiId: number;
  artist: string;
  title: string;
  dirName: string;
  songDir: string;
  downloadedAt: string; // ISO
};

const getSongsBaseDir = () => join(process.cwd(), "songs");
const getDownloadedFilePath = () => join(getSongsBaseDir(), "downloaded.json");

export const loadDownloadedEntries: Effect.Effect<DownloadedEntry[], Error> =
  Effect.tryPromise({
    try: async () => {
      const filePath = getDownloadedFilePath();
      try {
        const text = await readFile(filePath, "utf8");
        const json = JSON.parse(text);
        return Array.isArray(json) ? (json as DownloadedEntry[]) : [];
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
          return [] as DownloadedEntry[];
        }
        throw err;
      }
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to load downloaded entries"),
  });

export const saveDownloadedEntries = (
  entries: DownloadedEntry[],
): Effect.Effect<void, Error> =>
  Effect.tryPromise({
    try: async () => {
      const baseDir = getSongsBaseDir();
      await mkdir(baseDir, { recursive: true });
      const filePath = getDownloadedFilePath();
      await writeFile(filePath, JSON.stringify(entries, null, 2));
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to save downloaded entries"),
  });

export const appendDownloadedEntry = (
  entry: DownloadedEntry,
): Effect.Effect<DownloadedEntry[], Error> =>
  Effect.gen(function* () {
    const existing = yield* loadDownloadedEntries;
    const filtered = existing.filter((e) => e.apiId !== entry.apiId);
    const updated = [entry, ...filtered];
    yield* saveDownloadedEntries(updated);
    return updated;
  });
