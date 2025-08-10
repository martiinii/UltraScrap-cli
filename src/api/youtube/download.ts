import { spawn } from "node:child_process";
import { Effect } from "effect";

/**
 * Download a youtube video from direct link (watch URL or ID) and save to provided path.
 * Equivalent shell: yt-dlp -S "ext,res:1080" -o '${path}' -- ${link}
 */
export const downloadYoutubeVideo = (
  link: string,
  path: string,
): Effect.Effect<void, Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const args = ["-S", "ext,res:1080", "-o", path, "--", link];

      await new Promise<void>((resolve, reject) => {
        const child = spawn("yt-dlp", args, {
          stdio: ["ignore", "ignore", "ignore"],
        });
        child.on("error", (err) => reject(err));
        child.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`yt-dlp download failed (code ${code})`));
        });
      });
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to download youtube video"),
  });

export type YoutubeDownloadProgress = {
  percent: number; // 0..1
  eta?: string; // e.g. 00:12
  speed?: string; // e.g. 2.31MiB/s
};

// New type for the JSON progress output from yt-dlp
type YtDlpProgressData = {
  type: "progress";
  downloaded: number | string;
  total: "NA" | string;
  frag_index: number | string;
  frag_count: number | string;
};

/**
 * Download with progress updates via callback. Parses yt-dlp stdout progress lines in JSON format.
 * Uses --newline to receive line-by-line updates.
 */
export const downloadYoutubeVideoWithProgress = (
  link: string,
  path: string,
  onProgress: (p: YoutubeDownloadProgress) => void,
): Effect.Effect<void, Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const args = [
        "-S",
        "ext,res:1080",
        "-o",
        path,
        "--quiet",
        "--newline",
        "--no-warnings",
        "--progress",
        "--progress-template",
        `{"type": "progress", "downloaded": "%(progress.downloaded_bytes)s", "total": "%(progress.total_bytes)s", "frag_index": "%(progress.fragment_index)s", "frag_count": "%(progress.fragment_count)s"}`,
        "--",
        link,
      ];

      await new Promise<void>((resolve, reject) => {
        const child = spawn("yt-dlp", args, {
          stdio: ["ignore", "pipe", "pipe"],
        });

        const parseAndEmit = (line: string) => {
          try {
            // Try to parse the line as JSON
            const raw = line.trim();
            if (raw.length === 0) return;
            const maybeUnwrapped =
              (raw.startsWith("'") && raw.endsWith("'")) ||
              (raw.startsWith('"') && raw.endsWith('"'))
                ? raw.slice(1, -1)
                : raw;
            const data = JSON.parse(maybeUnwrapped) as YtDlpProgressData;

            if (data.type === "progress") {
              let percent = 0;

              const toNumber = (v: unknown): number => {
                if (typeof v === "number") return v;
                const n = Number.parseInt(String(v), 10);
                return Number.isNaN(n) ? Number.NaN : n;
              };

              if (data.total !== "NA") {
                // Use downloaded / total ratio
                const total = toNumber(data.total);
                const downloaded = toNumber(data.downloaded);
                if (
                  !Number.isNaN(total) &&
                  total > 0 &&
                  !Number.isNaN(downloaded)
                ) {
                  percent = Math.max(0, Math.min(1, downloaded / total));
                } else {
                  // Fallback to fragment-based ratio if total is not usable
                  const fragCount = toNumber(data.frag_count);
                  const fragIndex = toNumber(data.frag_index);
                  if (
                    !Number.isNaN(fragCount) &&
                    fragCount > 0 &&
                    !Number.isNaN(fragIndex)
                  ) {
                    const clampedIndex = Math.min(fragIndex, fragCount);
                    percent = Math.max(
                      0,
                      Math.min(1, clampedIndex / fragCount),
                    );
                  }
                }
              } else {
                // Use frag_index / frag_count ratio
                const fragCount = toNumber(data.frag_count);
                const fragIndex = toNumber(data.frag_index);
                if (
                  !Number.isNaN(fragCount) &&
                  fragCount > 0 &&
                  !Number.isNaN(fragIndex)
                ) {
                  // Clamp frag_index to frag_count to ensure ratio doesn't exceed 1
                  const clampedIndex = Math.min(fragIndex, fragCount);
                  percent = Math.max(0, Math.min(1, clampedIndex / fragCount));
                }
              }

              onProgress({ percent });
            }
          } catch {
            // Ignore lines that aren't valid JSON
            // This handles non-progress lines from yt-dlp
          }
        };

        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk) => {
          // do not print to console; parse progress only
          const text = chunk as string;
          text.split(/[\r\n]+/).forEach(parseAndEmit);
        });
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => {
          // do not print to console; parse progress only
          const text = chunk as string;
          text.split(/[\r\n]+/).forEach(parseAndEmit);
        });
        child.on("error", (err) => reject(err));
        child.on("close", (code) => {
          if (code === 0) {
            onProgress({ percent: 1 });
            resolve();
          } else {
            reject(new Error(`yt-dlp download failed (code ${code})`));
          }
        });
      });
    },
    catch: (e) =>
      e instanceof Error
        ? e
        : new Error("Failed to download youtube video with progress"),
  });
