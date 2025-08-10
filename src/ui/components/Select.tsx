import { Box, Text, useInput } from "ink";
import type { FC, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

export type SelectOption = { label: ReactNode; value: string };

export type SelectProps = {
  options: SelectOption[];
  value?: string | null;
  defaultValue?: string;
  visibleOptionCount?: number;
  onChange?: (value: string) => void;
};

export const Select: FC<SelectProps> = ({
  options,
  value,
  defaultValue,
  visibleOptionCount = 10,
  onChange,
}) => {
  const initialIndex = useMemo(() => {
    if (value != null) {
      const idx = options.findIndex((o) => o.value === value);
      return idx >= 0 ? idx : 0;
    }
    if (defaultValue != null) {
      const idx = options.findIndex((o) => o.value === defaultValue);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  }, [options, value, defaultValue]);

  const [index, setIndex] = useState<number>(initialIndex);

  useEffect(() => {
    if (value != null) {
      const idx = options.findIndex((o) => o.value === value);
      if (idx >= 0) setIndex(idx);
    }
  }, [value, options]);

  useInput((_, key) => {
    if (key.upArrow) {
      const next = Math.max(0, index - 1);
      setIndex(next);
      onChange?.(options[next]?.value ?? "");
    } else if (key.downArrow) {
      const next = Math.min(options.length - 1, index + 1);
      setIndex(next);
      onChange?.(options[next]?.value ?? "");
    } else if (key.return) {
      // Enter is handled by parent; do not fire onChange here to avoid stale state races
    }
  });

  const half = Math.floor(visibleOptionCount / 2);
  const start = Math.max(
    0,
    Math.min(index - half, options.length - visibleOptionCount),
  );
  const end = Math.min(options.length, start + visibleOptionCount);
  const visible = options.slice(start, end);

  return (
    <Box flexDirection="column">
      {visible.map((opt, i) => {
        const absoluteIndex = start + i;
        const selected = absoluteIndex === index;
        return (
          <Text key={opt.value}>
            <Text color={selected ? "cyanBright" : "gray"}>
              {selected ? ">" : " "}
            </Text>{" "}
            <Text bold={selected}>{opt.label}</Text>
          </Text>
        );
      })}
    </Box>
  );
};

export default Select;
