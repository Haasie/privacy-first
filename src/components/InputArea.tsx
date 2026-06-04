import { Box, Button, Group, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useFileInput } from "../hooks/useFileInput";

interface Props {
  filePath: string | null;
  inputText: string;
  outputDir: string | null;
  processing: boolean;
  onFilePicked: (path: string) => void;
  onTextChange: (text: string) => void;
  onOutputDirChange: (dir: string) => void;
  onProcess: () => void;
}

export default function InputArea({
  filePath,
  inputText,
  outputDir,
  processing,
  onFilePicked,
  onTextChange,
  onOutputDirChange,
  onProcess,
}: Props) {
  const { selectFile, selectOutputDir } = useFileInput(onFilePicked);

  const displayName = filePath
    ? (filePath.split("/").pop() ?? filePath.split("\\").pop() ?? filePath)
    : null;

  async function handleSelectOutputDir() {
    const dir = await selectOutputDir();
    if (dir) onOutputDirChange(dir);
  }

  return (
    <Stack gap="sm" h="100%">
      <Box
        p="md"
        onClick={selectFile}
        style={{
          border: "2px dashed var(--mantine-color-gray-4)",
          borderRadius: "var(--mantine-radius-md)",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <Text size="sm" c={displayName ? "inherit" : "dimmed"}>
          {displayName ?? "Drop a file here or click to choose (.txt, .pdf, .docx)"}
        </Text>
      </Box>

      <Textarea
        placeholder="Or paste text directly…"
        value={inputText}
        onChange={(e) => onTextChange(e.currentTarget.value)}
        autosize
        minRows={6}
        maxRows={12}
      />

      <Group gap="xs" align="flex-end">
        <TextInput
          label="Output folder"
          value={outputDir ?? ""}
          placeholder="Same as input file"
          readOnly
          style={{ flex: 1 }}
        />
        <Button variant="subtle" mt="xl" onClick={handleSelectOutputDir}>
          Browse
        </Button>
      </Group>

      <Button
        onClick={onProcess}
        loading={processing}
        disabled={!inputText.trim()}
        fullWidth
      >
        Process
      </Button>
    </Stack>
  );
}
