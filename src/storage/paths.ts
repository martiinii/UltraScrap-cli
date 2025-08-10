import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";
import envPaths from "env-paths";

const DEFAULT_APP_NAME = "ultrascrap-cli";

export const getCacheDir = (
  appName: string = DEFAULT_APP_NAME,
): Effect.Effect<string, Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const paths = envPaths(appName, { suffix: "" });
      const dir = paths.cache;
      await mkdir(dir, { recursive: true });
      return dir;
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to ensure cache dir"),
  });

export const resolveDataFilePath = (
  fileName: string,
): Effect.Effect<string, Error, never> =>
  Effect.gen(function* () {
    const dir = yield* getCacheDir();
    return join(dir, fileName);
  });
