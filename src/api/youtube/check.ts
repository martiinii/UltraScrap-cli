import { spawn } from "node:child_process";
import { Effect } from "effect";

/**
 * Check if yt-dlp is available by running `yt-dlp --version`.
 * Succeeds with true when exit code is 0; otherwise false. Never fails.
 */
export const checkYtDlpAvailable: Effect.Effect<boolean, never, never> =
  Effect.tryPromise({
    try: async () =>
      await new Promise<boolean>((resolve) => {
        const child = spawn("yt-dlp", ["--version"], {
          stdio: ["ignore", "ignore", "ignore"],
        });
        child.on("error", () => resolve(false));
        child.on("close", (code) => resolve(code === 0));
      }),
    catch: (e) => (e instanceof Error ? e : new Error("yt-dlp check failed")),
  }).pipe(Effect.catchAll(() => Effect.succeed(false)));
