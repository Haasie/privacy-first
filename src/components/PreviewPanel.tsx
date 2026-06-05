import { useEffect } from "react";
import { Badge, Box, Group, Paper, ScrollArea, Text, Tooltip } from "@mantine/core";
import type { PiiSpan, RedactionResult } from "../lib/ipc";
import { bgForLabel, colorForLabel, dutchLabel } from "../lib/categoryColors";
import { iconForLabel } from "../lib/categoryIcons";

interface Props {
  result: RedactionResult | null;
  inputText: string;
  keptSpans: Set<number>;
  hiddenLabels: Set<string>;
  onToggleSpan: (index: number) => void;
  highlightedSpan: number | null;
  onHighlightDone: () => void;
}

function buildSegments(text: string, spans: PiiSpan[]) {
  const segs: Array<{ text: string; span?: PiiSpan; spanIndex?: number }> = [];
  let pos = 0;
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (span.start > pos) segs.push({ text: text.slice(pos, span.start) });
    segs.push({ text: text.slice(span.start, span.end), span, spanIndex: i });
    pos = span.end;
  }
  if (pos < text.length) segs.push({ text: text.slice(pos) });
  return segs;
}

function Legend({
  spans,
  keptSpans,
  hiddenLabels,
}: {
  spans: PiiSpan[];
  keptSpans: Set<number>;
  hiddenLabels: Set<string>;
}) {
  const labels = [...new Set(spans.map((s) => s.label))];
  if (labels.length === 0) return null;
  const effectivelyKeptCount = spans.filter(
    (s, i) => keptSpans.has(i) || hiddenLabels.has(s.label),
  ).length;
  return (
    <Group gap={4} mb="sm" wrap="wrap">
      {labels.map((label) => {
        const isHidden = hiddenLabels.has(label);
        return (
          <Badge
            key={label}
            color={isHidden ? "gray" : colorForLabel(label)}
            variant={isHidden ? "outline" : "light"}
            size="xs"
            style={{ opacity: isHidden ? 0.45 : 1 }}
            leftSection={iconForLabel(label)}
          >
            {dutchLabel(label)}
          </Badge>
        );
      })}
      {effectivelyKeptCount > 0 && (
        <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
          {effectivelyKeptCount} bewaard
        </Text>
      )}
    </Group>
  );
}

export default function PreviewPanel({
  result,
  inputText,
  keptSpans,
  hiddenLabels,
  onToggleSpan,
  highlightedSpan,
  onHighlightDone,
}: Props) {
  useEffect(() => {
    if (highlightedSpan === null) return;
    const el = document.getElementById(`span-mark-${highlightedSpan}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("span-flash");
    void el.offsetWidth;
    el.classList.add("span-flash");
    const t = setTimeout(() => {
      el.classList.remove("span-flash");
      onHighlightDone();
    }, 1500);
    return () => clearTimeout(t);
  }, [highlightedSpan, onHighlightDone]);

  if (!result) {
    return (
      <Paper h="100%" p="md" withBorder>
        <Text c="dimmed" size="sm">Nog geen inhoud — verwerk een document om de voorvertoning te zien.</Text>
      </Paper>
    );
  }

  if (result.spans.length === 0) {
    return (
      <Paper h="100%" p="md" withBorder>
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{inputText}</Text>
        <Text c="dimmed" size="xs" mt="xs">Geen privégegevens gevonden.</Text>
      </Paper>
    );
  }

  const segments = buildSegments(inputText, result.spans);

  return (
    <Paper h="100%" p="md" withBorder>
      <Legend spans={result.spans} keptSpans={keptSpans} hiddenLabels={hiddenLabels} />
      <ScrollArea h="calc(100% - 36px)">
        <Box style={{ whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 13 }}>
          {segments.map((seg, i) => {
            if (!seg.span || seg.spanIndex === undefined) {
              return <span key={i}>{seg.text}</span>;
            }
            const kept = keptSpans.has(seg.spanIndex) || hiddenLabels.has(seg.span.label);
            const color = bgForLabel(seg.span.label);
            const borderColor = color.replace("0.25", "0.75");
            return (
              <Tooltip
                key={i}
                label={kept ? "Zichtbaar — klik om te verbergen" : "Wordt verborgen — klik om zichtbaar te laten"}
                withArrow
                position="top"
              >
                <mark
                  id={`span-mark-${seg.spanIndex}`}
                  onClick={() => onToggleSpan(seg.spanIndex!)}
                  style={{
                    background: kept ? "transparent" : color.replace("0.25", "0.18"),
                    borderRadius: 2,
                    padding: "0 1px",
                    cursor: "pointer",
                    borderBottom: `${kept ? "2px dashed" : "3px solid"} ${borderColor}`,
                    opacity: kept ? 0.5 : 1,
                    transition: "all 0.15s",
                    textDecoration: "none",
                  }}
                >
                  {seg.text}
                </mark>
              </Tooltip>
            );
          })}
        </Box>
      </ScrollArea>
    </Paper>
  );
}
