import { Badge, Box, Paper, ScrollArea, Text, Tooltip } from "@mantine/core";
import type { PiiSpan, RedactionResult } from "../lib/ipc";
import { colorForLabel } from "../lib/categoryColors";

interface Props {
  result: RedactionResult | null;
  inputText: string;
}

function buildSegments(text: string, spans: PiiSpan[]) {
  const segs: Array<{ text: string; span?: PiiSpan }> = [];
  let pos = 0;
  for (const span of spans) {
    if (span.start > pos) segs.push({ text: text.slice(pos, span.start) });
    segs.push({ text: text.slice(span.start, span.end), span });
    pos = span.end;
  }
  if (pos < text.length) segs.push({ text: text.slice(pos) });
  return segs;
}

export default function PreviewPanel({ result, inputText }: Props) {
  if (!result) {
    return (
      <Paper h="100%" p="md" withBorder>
        <Text c="dimmed" size="sm">
          No content yet — process a document to see the preview.
        </Text>
      </Paper>
    );
  }

  if (result.spans.length === 0) {
    return (
      <Paper h="100%" p="md" withBorder>
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {inputText}
        </Text>
        <Text c="dimmed" size="xs" mt="xs">
          No PII detected.
        </Text>
      </Paper>
    );
  }

  const segments = buildSegments(inputText, result.spans);

  return (
    <Paper h="100%" p="md" withBorder>
      <ScrollArea h="100%">
        <Box style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {segments.map((seg, i) =>
            seg.span ? (
              <Tooltip key={i} label={seg.span.label} withArrow>
                <Badge
                  color={colorForLabel(seg.span.label)}
                  variant="light"
                  style={{ cursor: "default", verticalAlign: "middle" }}
                >
                  {`<${seg.span.label.toUpperCase()}>`}
                </Badge>
              </Tooltip>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </Box>
      </ScrollArea>
    </Paper>
  );
}
