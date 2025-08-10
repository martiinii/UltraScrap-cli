import { Box, Text } from "ink";
import type { FC } from "react";
import type { DownloadedEntry } from "../../storage/downloaded.ts";
import ProgressBar from "./ProgressBar.tsx";

export type DownloadedListProps = {
  entries: DownloadedEntry[];
  currentDownloading?: Array<{
    artist: string;
    title: string;
    progress: number; // 0..1
  }> | null;
};

export const DownloadedList: FC<DownloadedListProps> = ({
  entries,
  currentDownloading,
}) => {
  return (
    <Box flexDirection="column">
      <Text color="magenta" bold>
        Recently downloaded
      </Text>
      {currentDownloading && currentDownloading.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          {currentDownloading.map((d, idx) => (
            <Box
              key={`${d.artist}-${d.title}-${idx}`}
              width="90%"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Box flexGrow={1} minWidth={0}>
                <Text wrap="truncate-end">
                  <Text color="cyanBright" bold>
                    {d.artist}
                  </Text>
                  <Text color="gray"> - </Text>
                  <Text color="cyanBright" bold>
                    {d.title}
                  </Text>
                </Text>
              </Box>
              <Box flexShrink={0}>
                <ProgressBar value={d.progress} />
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {entries.slice(0, 15).map((e) => (
        <Text key={e.apiId} wrap="truncate-end">
          <Text color="greenBright" bold>
            {e.artist}
          </Text>
          <Text color="gray"> - </Text>
          <Text color="greenBright" bold>
            {e.title}
          </Text>
        </Text>
      ))}
    </Box>
  );
};

export default DownloadedList;
