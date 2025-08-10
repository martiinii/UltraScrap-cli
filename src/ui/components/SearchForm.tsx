import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { FC } from "react";

export type FocusedField = "artist" | "title";

export type SearchFormProps = {
  artist: string;
  title: string;
  limit: number;
  focusedField: FocusedField;
  setArtist: (v: string) => void;
  setTitle: (v: string) => void;
};

export const SearchForm: FC<SearchFormProps> = ({
  artist,
  title,
  focusedField,
  setArtist,
  setTitle,
}) => {
  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Box width={10}>
          <Text color="white" bold>
            Artist:
          </Text>
        </Box>
        <TextInput
          value={artist}
          onChange={setArtist}
          focus={focusedField === "artist"}
          placeholder="e.g. Queen"
        />
      </Box>
      <Box>
        <Box width={10}>
          <Text color="white" bold>
            Title:
          </Text>
        </Box>
        <TextInput
          value={title}
          onChange={setTitle}
          focus={focusedField === "title"}
          placeholder="e.g. Bohemian Rhapsody"
        />
      </Box>
      <Box>
        <Text color="green">Press Enter to search</Text>
      </Box>
    </Box>
  );
};

export default SearchForm;
