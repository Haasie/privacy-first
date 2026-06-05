import { useState } from "react";
import { ActionIcon, Badge, Box, Group, Paper, ScrollArea, Stack, Text, Tooltip } from "@mantine/core";
import { IconLock, IconLockOpen } from "@tabler/icons-react";
import type { RedactionResult } from "../lib/ipc";
import { colorForLabel, dutchLabel } from "../lib/categoryColors";
import { iconForLabel } from "../lib/categoryIcons";

interface Props {
  result: RedactionResult | null;
  keptSpans: Set<number>;
  hiddenLabels: Set<string>;
  onToggleSpan: (index: number) => void;
  onToggleLabel: (label: string) => void;
  onJumpToSpan: (index: number) => void;
}

export default function PiiPanel({
  result, keptSpans, hiddenLabels, onToggleSpan, onToggleLabel, onJumpToSpan,
}: Props) {
  const [hoveredLock, setHoveredLock] = useState<number | null>(null);

  if (!result) {
    return (
      <Paper p="md" withBorder style={{ height: "100%" }}>
        <Text c="dimmed" size="sm">Nog geen resultaten.</Text>
      </Paper>
    );
  }

  if (result.spans.length === 0) {
    return (
      <Paper p="md" withBorder style={{ height: "100%" }}>
        <Text size="sm">Geen privégegevens gevonden in dit document.</Text>
      </Paper>
    );
  }

  const grouped = result.spans.reduce(
    (acc, span, i) => {
      (acc[span.label] ??= []).push({ span, index: i });
      return acc;
    },
    {} as Record<string, { span: typeof result.spans[0]; index: number }[]>,
  );

  const redactCount = result.spans.filter(
    (s, i) => !keptSpans.has(i) && !hiddenLabels.has(s.label),
  ).length;

  return (
    <Paper p="md" withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={600}>Privégegevens ({result.spans.length})</Text>
        {(keptSpans.size > 0 || hiddenLabels.size > 0) && (
          <Text size="xs" c="dimmed">
            {redactCount} verbergen · {result.spans.length - redactCount} bewaren
          </Text>
        )}
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs">
          {Object.entries(grouped).map(([label, items]) => {
            const hidden = hiddenLabels.has(label);
            const icon = iconForLabel(label);
            return (
              <Box key={label}>
                {/* Category badge — clickable to toggle entire category */}
                <Tooltip
                  label={hidden ? "Inschakelen — alles verbergen" : "Uitschakelen — categorie bewaren"}
                  withArrow position="right"
                >
                  <Badge
                    color={hidden ? "gray" : colorForLabel(label)}
                    variant={hidden ? "outline" : "light"}
                    size="sm"
                    mb={6}
                    leftSection={icon}
                    style={{ cursor: "pointer", opacity: hidden ? 0.5 : 1, gap: 4 }}
                    onClick={() => onToggleLabel(label)}
                  >
                    {dutchLabel(label)} ({items.length})
                  </Badge>
                </Tooltip>

                {/* Span rows */}
                {!hidden && (
                  <Stack gap={2} pl={4}>
                    {items.map(({ span, index }) => {
                      const kept = keptSpans.has(index);
                      const isHovering = hoveredLock === index;
                      // On hover, preview what the icon will look like after clicking
                      const previewKept = isHovering ? !kept : kept;

                      return (
                        <Group
                          key={index}
                          gap={6}
                          wrap="nowrap"
                          align="center"
                          style={{ userSelect: "none" }}
                          pr={4}
                        >
                          {/* Truncation wrapper ensures the Tooltip span doesn't break flex */}
                          <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                            <Tooltip label="Spring naar in voorvertoning" position="left" withArrow>
                              <Text
                                size="xs"
                                c={kept ? "dimmed" : "inherit"}
                                style={{
                                  cursor: "pointer",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                }}
                                onClick={() => onJumpToSpan(index)}
                              >
                                {span.original_value.replace(/\n/g, " · ")}
                              </Text>
                            </Tooltip>
                          </Box>

                          {/* Lock toggle — previews next state on hover */}
                          <Tooltip
                            label={kept ? "Zichtbaar — klik om te verbergen" : "Verborgen — klik om zichtbaar te laten"}
                            position="right"
                            withArrow
                          >
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color={previewKept ? "gray" : colorForLabel(label)}
                              radius="xl"
                              style={{ flexShrink: 0, cursor: "pointer" }}
                              onMouseEnter={() => setHoveredLock(index)}
                              onMouseLeave={() => setHoveredLock(null)}
                              onClick={() => onToggleSpan(index)}
                            >
                              {previewKept ? <IconLockOpen size={12} /> : <IconLock size={12} />}
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
