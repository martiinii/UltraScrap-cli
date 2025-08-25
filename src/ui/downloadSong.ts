import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";
import { downloadCoverById } from "../api/usdb/cover.ts";
import { getLyricsById } from "../api/usdb/lyrics.ts";
import type { Song } from "../api/usdb/search.ts";
import type { YoutubeLink } from "../api/usdb/youtube.ts";
import { getYoutubeLinksById } from "../api/usdb/youtube.ts";
import { downloadYoutubeVideoWithProgress } from "../api/youtube/download.ts";
import type { YoutubeVideo } from "../api/youtube/search.ts";
import { searchYoutubeVideos } from "../api/youtube/search.ts";

export type DownloadSongParams = {
    song: Song;
    cookie: string;
    baseDir?: string; // defaults to CWD/songs
    onProgress?: (p: number) => void; // 0..1
};

export type DownloadSongResult = {
    dirName: string;
    songDir: string;
};

const sanitizeForPath = (name: string) =>
    name
        .replace(/[\\/:"*?<>|]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\./g, "")
        .trim();

export const downloadSong = (
    params: DownloadSongParams,
): Effect.Effect<DownloadSongResult, Error> =>
    Effect.gen(function* () {
        const { song, cookie, onProgress } = params;
        const baseDir = params.baseDir ?? join(process.cwd(), "songs");

        const dirName = sanitizeForPath(`${song.artist} - ${song.title}`);
        const songDir = join(baseDir, dirName);

        // ensure directories
        yield* Effect.tryPromise({
            try: async () => {
                await mkdir(baseDir, { recursive: true });
                await mkdir(songDir, { recursive: true });
            },
            catch: (e) =>
                e instanceof Error ? e : new Error("Failed to create directories"),
        });

        // Resolve YouTube link first
        let videoLink: string | null = null;
        const links = yield* Effect.catchAll(
            getYoutubeLinksById(song.apiId, cookie),
            () => Effect.succeed<YoutubeLink[]>([]),
        );
        if (links.length > 0) {
            videoLink = links[0]?.link ?? null;
        }
        if (!videoLink) {
            const results = yield* Effect.catchAll(
                searchYoutubeVideos(`${song.artist} ${song.title}`),
                () => Effect.succeed<YoutubeVideo[]>([]),
            );
            const first = results[0];
            if (first) videoLink = first.url || first.id;
        }
        if (!videoLink) {
            return yield* Effect.fail(
                new Error("No YouTube links found for this song"),
            );
        }
        const normalizedLink = /^(https?:)?\/\//.test(videoLink)
            ? videoLink
            : `https://youtu.be/${videoLink}`;

        // Parallel: cover, lyrics, and video download (with progress)
        const coverEff = Effect.gen(function* () {
            const coverBytes = yield* Effect.catchAll(
                downloadCoverById(song.apiId, cookie),
                () => Effect.succeed<Uint8Array | null>(null),
            );
            if (coverBytes) {
                yield* Effect.tryPromise({
                    try: async () => {
                        await writeFile(join(songDir, "cover.jpg"), coverBytes);
                    },
                    catch: (e) =>
                        e instanceof Error ? e : new Error("Failed to write cover"),
                });
            }
        });

        const lyricsEff = Effect.gen(function* () {
            const parsed = yield* getLyricsById(song.apiId, cookie);
            if (!parsed) return;
            const headers = {
                ...parsed.headers,
                mp3: "video.mp4",
                video: "video.mp4",
                cover: "cover.jpg",
            } as Record<string, string | undefined>;
            const headerLines = Object.entries(headers)
                .filter(([, v]) => v != null && String(v).trim().length > 0)
                .map(([k, v]) => `#${k.toUpperCase()}:${v}`)
                .join("\n");
            const content = `${headerLines}\n${parsed.lyrics.trim()}\n`;
            yield* Effect.tryPromise({
                try: async () => {
                    await writeFile(join(songDir, "song.txt"), content);
                },
                catch: (e) =>
                    e instanceof Error ? e : new Error("Failed to write lyrics"),
            });
        });

        const videoEff = downloadYoutubeVideoWithProgress(
            normalizedLink,
            join(songDir, "video.mp4"),
            (p) => onProgress?.(p.percent ?? 0),
        );

        // run in parallel
        yield* Effect.all([coverEff, lyricsEff, videoEff], { concurrency: 3 });

        return { dirName, songDir } as DownloadSongResult;
    });
