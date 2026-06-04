import { useState } from "react";
import { Badge, Button, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import type { RedactionResult } from "../lib/ipc";
import { colorForLabel } from "../lib/categoryColors";
import { sidecar } from "../lib/sidecar";

interface Props {
  result: RedactionResult | null;
  filePath: string | null;
  outputDir: string | null;
}

export default function PiiPanel({ result, filePath, outputDir }: Props) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!result) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed" size="sm">No results yet.</Text>
      </Paper>
    );
  }

  if (result.spans.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Text size="sm">No PII detected in this document.</Text>
      </Paper>
    );
  }

  const grouped = result.spans.reduce(
    (acc, span) => {
      (acc[span.label] ??= []).push(span);
      return acc;
    },
    {} as Record<string, typeof result.spans>,
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(result!.redacted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await sidecar.saveOutput(result!.redacted_text, filePath ?? "", outputDir);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={500}>
          Detected PII ({result.spans.length})
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="subtle" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy redacted text"}
          </Button>
          <Button size="xs" onClick={handleSave} loading={saving}>
            Save file
          </Button>
        </Group>
      </Group>
      <ScrollArea h={180}>
        <Stack gap="xs">
          {Object.entries(grouped).map(([label, spans]) => (
            <div key={label}>
              <Badge color={colorForLabel(label)} variant="light" mb={4}>
                {label}
              </Badge>
              {spans.map((span, i) => (
                <Text key={i} size="xs" c="dimmed" pl="sm">
                  {span.original_value}
                </Text>
              ))}
            </div>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
