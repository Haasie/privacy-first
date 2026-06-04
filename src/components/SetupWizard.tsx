import { useEffect, useState } from "react";
import { Button, Center, Loader, Progress, Stack, Text, Title } from "@mantine/core";
import { useModelStatus } from "../hooks/useModelStatus";
import { sidecar } from "../lib/sidecar";

interface Props {
  onReady: () => void;
}

export default function SetupWizard({ onReady }: Props) {
  const { status, loading, error, refetch } = useModelStatus();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (status?.ready) onReady();
  }, [status, onReady]);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await sidecar.downloadModel();
      refetch();
    } catch (e) {
      setDownloadError(String(e));
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Text c="red">Failed to check model status: {error}</Text>
      </Center>
    );
  }

  return (
    <Center h="100vh">
      <Stack align="center" gap="md" w={420}>
        <Title order={2}>Welcome to privacy-first</Title>
        <Text ta="center" c="dimmed">
          This app requires the <b>openai/privacy-filter</b> model (~3 GB) to detect
          and redact PII locally. Nothing ever leaves your machine.
        </Text>

        {downloadError && (
          <Text c="red" size="sm">
            {downloadError}
          </Text>
        )}

        {downloading ? (
          <Stack align="center" gap="xs" w="100%">
            <Text size="sm" c="dimmed">Downloading model…</Text>
            <Progress value={100} animated w="100%" />
          </Stack>
        ) : (
          <Button onClick={handleDownload} size="md">
            Download model (~3 GB)
          </Button>
        )}
      </Stack>
    </Center>
  );
}
