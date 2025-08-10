import { Text } from "ink";
import type { FC } from "react";

export type Mode = "form" | "results";

export const HelpRow: FC<{ mode: Mode; canDownload?: boolean }> = ({
  mode,
  canDownload = true,
}) => {
  if (mode === "form") {
    return (
      <Text>
        <Text color="white" bold>
          Tips:
        </Text>{" "}
        <Text dimColor>Tab: switch field • Enter: search • Esc: quit</Text>
      </Text>
    );
  }
  return (
    <Text>
      <Text color="white" bold>
        Tips:
      </Text>{" "}
      {canDownload ? (
        <Text dimColor>
          ↑/↓: select • Enter: download • ←/→: page • e: edit search • r:
          refresh • Esc: back
        </Text>
      ) : (
        <Text dimColor>
          ↑/↓: select • ←/→: page • e: edit search • r: refresh • Esc: back
        </Text>
      )}
    </Text>
  );
};

export default HelpRow;
