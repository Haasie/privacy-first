import { Box, Button, Group, Stack, Text, ThemeIcon, Anchor } from "@mantine/core";
import {
  IconUpload, IconFileText, IconShieldCheck,
  IconFileCheck, IconFolderOpen, IconFolder,
} from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-shell";
import { dirname } from "@tauri-apps/api/path";
import { useFileInput } from "../hooks/useFileInput";

interface Props {
  filePath: string | null;
  charCount: number;
  outputDir: string | null;
  processing: boolean;
  processed: boolean;
  saving: boolean;
  savedPath: string | null;
  onFilePicked: (path: string) => void;
  onOutputDirChange: (dir: string) => void;
  onProcess: () => void;
  onSave: () => void;
}

/** Show last two path segments to avoid overflow: ~/Documents/Facturen → ...Documents/Facturen */
function shortPath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length <= 2) return path;
  return `…/${parts.slice(-2).join("/")}`;
}

export default function InputArea({
  filePath,
  charCount,
  outputDir,
  processing,
  processed,
  saving,
  savedPath,
  onFilePicked,
  onOutputDirChange,
  onProcess,
  onSave,
}: Props) {
  const { selectFile, selectOutputDir, isDragging } = useFileInput(onFilePicked);

  const displayName = filePath
    ? (filePath.split("/").pop() ?? filePath.split("\\").pop() ?? filePath)
    : null;

  const ext = filePath?.split(".").pop()?.toLowerCase();
  const saveLabel =
    ext === "pdf" ? "Sla geredigeerde PDF op" :
    ext === "docx" ? "Sla geredigeerde DOCX op" :
    "Sla geredigeerde TXT op";

  async function handleSelectOutputDir() {
    const dir = await selectOutputDir();
    if (dir) onOutputDirChange(dir);
  }

  async function handleOpenFile() {
    if (savedPath) await open(savedPath);
  }

  async function handleOpenFolder() {
    if (!savedPath) return;
    await open(await dirname(savedPath));
  }

  return (
    <Stack gap="sm">
      {/* ── Drop zone ── */}
      <Box
        p="xl"
        onClick={selectFile}
        style={{
          border: `2px dashed ${isDragging ? "var(--mantine-color-blue-5)" : "var(--mantine-color-gray-4)"}`,
          borderRadius: "var(--mantine-radius-md)",
          textAlign: "center",
          cursor: "pointer",
          minHeight: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: isDragging ? "var(--mantine-color-blue-0)" : "transparent",
          transition: "all 0.15s",
        }}
      >
        {displayName ? (
          <>
            <ThemeIcon variant="light" color="blue" size="lg" radius="xl">
              <IconFileText size={18} />
            </ThemeIcon>
            <Text size="sm" fw={500}>{displayName}</Text>
            <Text size="xs" c="dimmed">{charCount.toLocaleString()} tekens — klik om te wijzigen</Text>
          </>
        ) : (
          <>
            <ThemeIcon variant="light" color="gray" size="xl" radius="xl">
              <IconUpload size={22} />
            </ThemeIcon>
            <Text size="sm" fw={500} c={isDragging ? "blue" : "inherit"}>
              {isDragging ? "Loslaten om te openen" : "Sleep een bestand hierheen of klik om te bladeren"}
            </Text>
            <Text size="xs" c="dimmed">.pdf · .docx · .txt</Text>
          </>
        )}
      </Box>

      {/* ── Output folder — full-width clickable card ── */}
      <Box>
        <Text size="xs" fw={500} c="dimmed" mb={4}>Uitvoermap</Text>
        <Box
          onClick={handleSelectOutputDir}
          style={{
            border: "1px solid var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-sm)",
            padding: "7px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "border-color 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--mantine-color-blue-4)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--mantine-color-default-border)")}
        >
          <IconFolder size={15} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
          <Text size="sm" c={outputDir ? "inherit" : "dimmed"} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {outputDir ? shortPath(outputDir) : "Zelfde map als het invoerbestand"}
          </Text>
        </Box>
      </Box>

      {/* ── Action area — state machine ── */}

      {/* Step 1+2: no file or file picked — show Verwerken */}
      {!processed && (
        <Button
          onClick={onProcess}
          loading={processing}
          disabled={charCount === 0}
          fullWidth
          size="md"
          color="blue"
        >
          Verwerken
        </Button>
      )}

      {/* Step 3: processed, not yet saved */}
      {processed && !savedPath && (
        <>
          <Button
            onClick={onSave}
            loading={saving}
            fullWidth
            size="md"
            color="blue"
            leftSection={<IconShieldCheck size={16} />}
          >
            {saveLabel}
          </Button>
          <Text
            size="xs"
            c="dimmed"
            ta="center"
            style={{ cursor: "pointer" }}
            onClick={onProcess}
          >
            Opnieuw verwerken
          </Text>
        </>
      )}

      {/* Step 4: saved — file is written, primary action is to open it */}
      {savedPath && (
        <>
          <Button
            onClick={handleOpenFile}
            fullWidth
            size="md"
            color="teal"
            leftSection={<IconFileCheck size={16} />}
          >
            Open geredigeerd bestand
          </Button>
          <Group justify="center" gap="lg">
            <Anchor size="xs" c="dimmed" onClick={onProcess}>Opnieuw verwerken</Anchor>
            <Anchor size="xs" c="dimmed" onClick={selectFile}>Ander bestand</Anchor>
            <Anchor size="xs" c="dimmed" onClick={handleOpenFolder}>
              <Group gap={3}>
                <IconFolderOpen size={11} />
                Open map
              </Group>
            </Anchor>
          </Group>
        </>
      )}
    </Stack>
  );
}
