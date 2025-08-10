import { Effect } from "effect";
import { Box, Text, useApp, useInput } from "ink";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Page, type Song, searchSongs } from "../api/usdb/search.ts";
import { checkYtDlpAvailable } from "../api/youtube/check.ts";
import { ytDlpInstallHint } from "../platform.ts";
import { ensureSession } from "../session.ts";
import {
  appendDownloadedEntry,
  type DownloadedEntry,
  loadDownloadedEntries,
} from "../storage/downloaded.ts";
import DownloadedList from "./components/DownloadedList.tsx";
import HelpRow from "./components/HelpRow.tsx";
import LoadingRow from "./components/LoadingRow.tsx";
import SearchForm from "./components/SearchForm.tsx";
import Select from "./components/Select.tsx";
import { downloadSong } from "./downloadSong.ts";

type Mode = "form" | "results";

export const App: FC = () => {
  const { exit } = useApp();

  const [mode, setMode] = useState<Mode>("form");
  const [focusedField, setFocusedField] = useState<"artist" | "title">(
    "artist",
  );

  const [artist, setArtist] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [limit] = useState<number>(20);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [_user, setUser] = useState<string>("");
  const [cookie, setCookie] = useState<string>("");

  const [ytAvailable, setYtAvailable] = useState<boolean | null>(null);

  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeDownloads, setActiveDownloads] = useState<
    Array<{ apiId: number; artist: string; title: string; progress: number }>
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadedEntries, setDownloadedEntries] = useState<DownloadedEntry[]>(
    [],
  );

  const canPaginate = useMemo(() => totalPages > 1, [totalPages]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setIsInitializing(true);
        const session = await Effect.runPromise(ensureSession);
        if (!isMounted) return;
        setCookie(session.cookie);
        setUser(session.user);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
      } finally {
        setIsInitializing(false);
      }
    };
    void run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const ok = await Effect.runPromise(checkYtDlpAvailable);
      if (!canceled) setYtAvailable(ok);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      const entries = await Effect.runPromise(loadDownloadedEntries);
      setDownloadedEntries(entries);
    };
    void run();
  }, []);

  const fetchPage = useCallback(
    async (pageNumber: number) => {
      if (!cookie) return;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const pageStart = (pageNumber - 1) * limit;
        const page: Page = await Effect.runPromise(
          searchSongs(
            {
              interpret: artist.trim() || undefined,
              title: title.trim() || undefined,
              limit,
              start: pageStart,
            },
            cookie,
          ),
        );
        setSongs(page.songs);
        setSelectedIndex(0);
        setTotalPages(page.totalPages || 0);
        setCurrentPage(pageNumber);
        setMode("results");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    },
    [artist, title, cookie, limit],
  );

  const onSubmitSearch = useCallback(() => {
    void fetchPage(1);
  }, [fetchPage]);

  const downloadSelectedSong = useCallback(
    async (index?: number) => {
      const song = songs[index ?? selectedIndex];
      if (!song || !cookie) return;
      if (ytAvailable === false) {
        setErrorMessage("yt-dlp is not installed. Downloading is disabled.");
        return;
      }

      // if already downloading this song, skip
      if (activeDownloads.some((d) => d.apiId === song.apiId)) return;

      setErrorMessage(null);
      // add to active downloads
      setActiveDownloads((prev) => [
        ...prev,
        {
          apiId: song.apiId,
          artist: song.artist,
          title: song.title,
          progress: 0,
        },
      ]);

      try {
        const result = await Effect.runPromise(
          downloadSong({
            song,
            cookie,
            onProgress: (p) =>
              setActiveDownloads((prev) =>
                prev.map((d) =>
                  d.apiId === song.apiId ? { ...d, progress: p } : d,
                ),
              ),
          }),
        );

        // persist downloaded entry
        try {
          const updated = await Effect.runPromise(
            appendDownloadedEntry({
              apiId: song.apiId,
              artist: song.artist,
              title: song.title,
              dirName: result.dirName,
              songDir: result.songDir,
              downloadedAt: new Date().toISOString(),
            }),
          );
          setDownloadedEntries(updated);
        } catch {}
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
      } finally {
        // remove from active downloads
        setActiveDownloads((prev) =>
          prev.filter((d) => d.apiId !== song.apiId),
        );
      }
    },
    [songs, selectedIndex, cookie, activeDownloads, ytAvailable],
  );

  useInput((input, key) => {
    if (key.escape) {
      if (mode === "results") {
        setMode("form");
        return;
      }
      if (mode === "form") {
        exit();
        return;
      }
    }
    if (mode === "form") {
      if (key.tab) {
        setFocusedField((prev) => (prev === "artist" ? "title" : "artist"));
        return;
      }
      if (key.return) {
        onSubmitSearch();
        return;
      }
    } else if (mode === "results") {
      if (input === "e") {
        setMode("form");
        return;
      }
      if (input === "r") {
        void fetchPage(currentPage);
        return;
      }
      // Up/Down handled by Select component
      if (key.return && !isLoading) {
        void downloadSelectedSong();
        return;
      }
      if (key.leftArrow) {
        if (currentPage > 1) void fetchPage(currentPage - 1);
        return;
      }
      if (key.rightArrow) {
        if (totalPages === 0 || currentPage < totalPages) {
          void fetchPage(currentPage + 1);
        }
        return;
      }
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color="magentaBright" bold underline>
          UltraStar CLI
        </Text>
      </Box>

      {/* Status Row */}
      <Box flexDirection="column">
        <Text>
          <Text color="white" bold>
            Login:
          </Text>{" "}
          {cookie ? (
            <Text color="greenBright">Logged in</Text>
          ) : isInitializing ? (
            <Text color="yellow">Checking…</Text>
          ) : (
            <Text color="red">Not logged in</Text>
          )}
        </Text>
        {!isInitializing && !cookie && (
          <Text color="red">
            An unknown error occured. Please report on GitHub.
          </Text>
        )}
        <Text>
          <Text color="white" bold>
            yt-dlp:
          </Text>{" "}
          {ytAvailable == null ? (
            <Text color="yellow">Checking…</Text>
          ) : ytAvailable ? (
            <Text color="greenBright">Available</Text>
          ) : (
            <Text>
              <Text color="red">Not installed.</Text>{" "}
              <Text dimColor>
                {ytDlpInstallHint()} See
                https://github.com/yt-dlp/yt-dlp#installation
              </Text>
            </Text>
          )}
        </Text>
        {ytAvailable === false && (
          <Text>
            <Text color="red" bold>
              Downloading songs is not possible without yt-dlp.
            </Text>
          </Text>
        )}
      </Box>

      {isInitializing ? (
        <LoadingRow label="Initializing session..." />
      ) : (
        <>
          {mode === "form" && (
            <SearchForm
              artist={artist}
              title={title}
              limit={limit}
              focusedField={focusedField}
              setArtist={setArtist}
              setTitle={setTitle}
            />
          )}

          {mode === "results" && (
            <Box flexDirection="row">
              <Box flexDirection="column" width={"50%"}>
                {isLoading ? (
                  <LoadingRow label="Searching..." />
                ) : (
                  <>
                    {songs.length === 0 ? (
                      <Text color="yellow">No results.</Text>
                    ) : (
                      <Select
                        options={songs.map((s, i) => ({
                          label: (
                            <Text>
                              <Text color="yellowBright">{s.artist}</Text>
                              <Text color="gray"> - </Text>
                              <Text color="cyanBright">{s.title}</Text>
                              {s.languages.length > 0 && (
                                <Text>
                                  {" "}
                                  <Text color="gray">[</Text>
                                  <Text color="magentaBright">
                                    {s.languages.join(", ")}
                                  </Text>
                                  <Text color="gray">]</Text>
                                </Text>
                              )}
                            </Text>
                          ),
                          value: String(i),
                        }))}
                        onChange={(v: string) => {
                          const idx = Number(v);
                          setSelectedIndex(idx);
                        }}
                        visibleOptionCount={20}
                        value={String(selectedIndex)}
                      />
                    )}
                    <Box>
                      <Text>
                        <Text color="white" bold>
                          Page
                        </Text>{" "}
                        <Text color="cyanBright" bold>
                          {totalPages === 0 ? 0 : currentPage}
                        </Text>{" "}
                        <Text color="white" bold>
                          of
                        </Text>{" "}
                        <Text color="cyanBright" bold>
                          {totalPages}
                        </Text>
                      </Text>
                    </Box>
                    {canPaginate && (
                      <Text dimColor>Use ←/→ to navigate pages</Text>
                    )}
                  </>
                )}
              </Box>
              <Box flexDirection="column" width={"40%"}>
                <DownloadedList
                  entries={downloadedEntries}
                  currentDownloading={activeDownloads.map((d) => ({
                    artist: d.artist,
                    title: d.title,
                    progress: d.progress,
                  }))}
                />
              </Box>
            </Box>
          )}

          {errorMessage && (
            <Text>
              <Text color="red" bold>
                Error:
              </Text>{" "}
              <Text color="red">{errorMessage}</Text>
            </Text>
          )}

          <HelpRow mode={mode} canDownload={ytAvailable !== false} />
        </>
      )}
    </Box>
  );
};

export default App;
