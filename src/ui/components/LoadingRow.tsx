import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { FC } from "react";

export const LoadingRow: FC<{ label: string }> = ({ label }) => (
  <Box>
    <Text>
      <Text color="greenBright">
        <Spinner type="dots" />
      </Text>{" "}
      <Text color="gray" dimColor>
        {label}
      </Text>
    </Text>
  </Box>
);

export default LoadingRow;
