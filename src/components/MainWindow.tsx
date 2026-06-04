import { useCallback, useState } from "react";
import { Grid } from "@mantine/core";
import { dirname } from "@tauri-apps/api/path";
import ErrorBanner from "./ErrorBanner";
import InputArea from "./InputArea";
import PreviewPanel from "./PreviewPanel";
import PiiPanel from "./PiiPanel";
import { sidecar } from "../lib/sidecar";
import type { RedactionResult } from "../lib/ipc";

export default function MainWindow() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [result, setResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilePicked = useCallback(async (path: string) => {
    setFilePath(path);
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
    setError(null);
    try {
      setResult(await sidecar.redact(inputText));
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Grid p="md" style={{ height: "100vh" }} gutter="md">
      {error && (
        <Grid.Col span={12}>
          <ErrorBanner error={error} onDismiss={() => setError(null)} />
        </Grid.Col>
      )}
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
        <PiiPanel result={result} filePath={filePath} outputDir={outputDir} />
      </Grid.Col>
    </Grid>
  );
}
