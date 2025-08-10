import { spawn } from "node:child_process";
import { Effect } from "effect";

export type YoutubeThumbnail = {
  url: string;
  id?: string;
  height?: number;
  width?: number;
};

export type YoutubeVideo = {
  id: string;
  url: string;
  title: string;
  description: null;
  duration: number;
  channel_id: string;
  channel: string;
  channel_url: string;
  thumbnails: YoutubeThumbnail[];
  view_count: number;
  channel_is_verified: boolean;
};

/**
 * Search youtube videos using yt-dlp and parse JSONL output.
 */
export const searchYoutubeVideos = (
  search: string,
): Effect.Effect<YoutubeVideo[], Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const args = [
        "--match-filters",
        "original_url!*=/shorts/",
        `ytsearch5:${search}`,
        "--flat-playlist",
        "-j",
        "--no-simulate",
      ];

      const result = await new Promise<string>((resolve, reject) => {
        const child = spawn("yt-dlp", args, {
          stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";

        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => {
          stdout += chunk as string;
        });
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk) => {
          stderr += chunk as string;
        });
        child.on("error", (err) => reject(err));
        child.on("close", (code) => {
          if (code === 0) resolve(stdout);
          else
            reject(
              new Error(
                `yt-dlp search failed (code ${code}): ${stderr.trim()}`,
              ),
            );
        });
      });

      const json = `[${result.split("\n").filter(Boolean).join(",")} ]`;
      return JSON.parse(json) as YoutubeVideo[];
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to search youtube"),
  });
