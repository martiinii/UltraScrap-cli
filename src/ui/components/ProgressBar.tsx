import { Box, Text } from "ink";
import type { FC } from "react";

export type ProgressBarProps = {
  value: number; // 0..1
  width?: number; // bar width in characters (defaults to 30)
};

export const ProgressBar: FC<ProgressBarProps> = ({ value, width = 30 }) => {
  const clamped = Math.max(0, Math.min(1, value ?? 0));
  const barWidth = Math.max(1, width);
  const filledBlockCount = Math.round(clamped * barWidth);
  const emptyBlockCount = Math.max(0, barWidth - filledBlockCount);

  // Use background color blocks (spaces) to achieve gapless bar

  const toRgb = (hex: string): { r: number; g: number; b: number } => {
    const normalized = hex.replace(/^#/, "");
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return { r, g, b };
  };
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

  const startHex = "#14b8a6"; // teal-ish
  const endHex = "#22c55e"; // green
  const start = toRgb(startHex);
  const end = toRgb(endHex);

  const gradientColors: Array<{ key: string; color: string }> = [];
  if (filledBlockCount > 0) {
    for (let i = 0; i < filledBlockCount; i++) {
      // Use absolute position across the entire bar so the last filled block
      // reflects the global progress (e.g., 50% => halfway to green)
      const t = Math.min(1, (i + 1) / barWidth);
      const r = lerp(start.r, end.r, t);
      const g = lerp(start.g, end.g, t);
      const b = lerp(start.b, end.b, t);
      const color = rgbToHex(r, g, b);
      gradientColors.push({
        key: `${color}-${filledBlockCount}-${barWidth}-${t.toFixed(3)}`,
        color,
      });
    }
  }

  const showAllGray = clamped === 0;

  return (
    <Box flexGrow={1} minWidth={0}>
      <Text>
        {showAllGray ? (
          <Text backgroundColor="#555555">{" ".repeat(barWidth)}</Text>
        ) : (
          <>
            {gradientColors.map(({ key, color }) => (
              <Text key={key} backgroundColor={color}>
                {" "}
              </Text>
            ))}
            {emptyBlockCount > 0 && (
              <Text backgroundColor="#555555">
                {" ".repeat(emptyBlockCount)}
              </Text>
            )}
          </>
        )}
      </Text>
    </Box>
  );
};

export default ProgressBar;
