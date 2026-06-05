import { useCallback, useState } from "react";
import { ActionIcon, Grid, Group, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { dirname } from "@tauri-apps/api/path";
import ErrorBanner from "./ErrorBanner";
import InputArea from "./InputArea";
import PreviewPanel from "./PreviewPanel";
import PiiPanel from "./PiiPanel";
import { sidecar } from "../lib/sidecar";
import type { RedactionResult } from "../lib/ipc";

function DarkModeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <Tooltip label={colorScheme === "dark" ? "Lichte modus" : "Donkere modus"} position="left">
      <ActionIcon variant="subtle" color="gray" onClick={() => toggleColorScheme()} size="sm">
        {colorScheme === "dark" ? <IconSun size={15} /> : <IconMoon size={15} />}
      </ActionIcon>
    </Tooltip>
  );
}

export default function MainWindow() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [result, setResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keptSpans, setKeptSpans] = useState<Set<number>>(new Set());
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());
  const [highlightedSpan, setHighlightedSpan] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  const handleFilePicked = useCallback(async (path: string) => {
    setFilePath(path);
    setResult(null);
    setKeptSpans(new Set());
    setHiddenLabels(new Set());
    setProcessed(false);
    setSavedPath(null);
    setError(null);
    try {
      const parsed = await sidecar.parseFile(path);
      setInputText(parsed.text);
      setOutputDir(await dirname(path));
      if (parsed.warning) setError(parsed.warning);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  async function handleProcess() {
    if (!inputText.trim()) return;
    setProcessing(true);
    setKeptSpans(new Set());
    setHiddenLabels(new Set());
    setSavedPath(null);
    setError(null);
    try {
      const r = await sidecar.redact(inputText);
      setResult(r);
      setProcessed(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }

  async function handleSave() {
    if (!result || !filePath) return;
    setSaving(true);
    setSavedPath(null);
    try {
      const spansToRedact = result.spans.filter(
        (s, i) => !keptSpans.has(i) && !hiddenLabels.has(s.label),
      );
      const res = await sidecar.saveRedactedFile(filePath, spansToRedact, result.redacted_text, outputDir);
      setSavedPath(res.path);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleToggleSpan(index: number) {
    setKeptSpans((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleToggleLabel(label: string) {
    setHiddenLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <Grid p="md" gutter="md" style={{ minHeight: "100vh" }} align="stretch">
      <Grid.Col span={12}>
        <Group justify="flex-end">
          <DarkModeToggle />
        </Group>
      </Grid.Col>

      {error && (
        <Grid.Col span={12}>
          <ErrorBanner error={error} onDismiss={() => setError(null)} />
        </Grid.Col>
      )}

      {/* 3-column layout: controls | preview | detected PII */}
      <Grid.Col span={4}>
        <InputArea
          filePath={filePath}
          charCount={inputText.length}
          outputDir={outputDir}
          processing={processing}
          processed={processed}
          saving={saving}
          savedPath={savedPath}
          onFilePicked={handleFilePicked}
          onOutputDirChange={setOutputDir}
          onProcess={handleProcess}
          onSave={handleSave}
        />
      </Grid.Col>
      <Grid.Col span={5} style={{ display: "flex", flexDirection: "column" }}>
        <PreviewPanel
          result={result}
          inputText={inputText}
          keptSpans={keptSpans}
          hiddenLabels={hiddenLabels}
          onToggleSpan={handleToggleSpan}
          highlightedSpan={highlightedSpan}
          onHighlightDone={() => setHighlightedSpan(null)}
        />
      </Grid.Col>
      <Grid.Col span={3} style={{ display: "flex", flexDirection: "column" }}>
        <PiiPanel
          result={result}
          keptSpans={keptSpans}
          hiddenLabels={hiddenLabels}
          onToggleSpan={handleToggleSpan}
          onToggleLabel={handleToggleLabel}
          onJumpToSpan={setHighlightedSpan}
        />
      </Grid.Col>
    </Grid>
  );
}
