import { useCallback, useState } from "react";
import { Grid, Text } from "@mantine/core";
import { dirname } from "@tauri-apps/api/path";
import InputArea from "./InputArea";
import PreviewPanel from "./PreviewPanel";
import { sidecar } from "../lib/sidecar";
import type { RedactionResult } from "../lib/ipc";

export default function MainWindow() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [result, setResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFilePicked = useCallback(async (path: string) => {
    setFilePath(path);
    try {
      const parsed = await sidecar.parseFile(path);
      setInputText(parsed.text);
      setOutputDir(await dirname(path));
    } catch {
      // error handling wired in Task 13
    }
  }, []);

  async function handleProcess() {
    if (!inputText.trim()) return;
    setProcessing(true);
    try {
      setResult(await sidecar.redact(inputText));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Grid p="md" style={{ height: "100vh" }} gutter="md">
      <Grid.Col span={6}>
        <InputArea
          filePath={filePath}
          inputText={inputText}
          outputDir={outputDir}
          processing={processing}
          onFilePicked={handleFilePicked}
          onTextChange={setInputText}
          onOutputDirChange={setOutputDir}
          onProcess={handleProcess}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <PreviewPanel result={result} inputText={inputText} />
      </Grid.Col>
      <Grid.Col span={12}>
        <Text c="dimmed" size="sm">PII panel — Task 11</Text>
      </Grid.Col>
    </Grid>
  );
}
