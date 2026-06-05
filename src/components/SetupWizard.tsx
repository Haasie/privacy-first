import { useEffect, useState } from "react";
import { Alert, Button, Center, Loader, Stack, Text, Title } from "@mantine/core";
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
        <Title order={2}>Welkom bij Privacy First</Title>
        <Text ta="center" c="dimmed">
          De app heeft het <b>openai/privacy-filter</b> model (~2,6 GB) nodig om privégegevens
          lokaal te detecteren. Er wordt niets naar buiten gestuurd.
        </Text>

        {downloadError && (
          <Alert color="red" title="Download mislukt" w="100%">
            <Text size="sm">{downloadError}</Text>
            <Text size="xs" c="dimmed" mt={4}>
              Controleer je internetverbinding en probeer het opnieuw.
            </Text>
          </Alert>
        )}

        {downloading ? (
          <Stack align="center" gap="xs">
            <Loader size="md" />
            <Text size="sm" c="dimmed">Model downloaden — dit kan enkele minuten duren…</Text>
          </Stack>
        ) : (
          <Button onClick={handleDownload} size="md">
            {downloadError ? "Opnieuw proberen" : "Model downloaden (~2,6 GB)"}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
