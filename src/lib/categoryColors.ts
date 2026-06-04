const COLORS: Record<string, string> = {
  private_person: "blue",
  private_email: "green",
  private_phone: "orange",
  private_address: "grape",
  private_id: "red",
  private_url: "cyan",
  private_date: "yellow",
  private_organization: "pink",
};

export function colorForLabel(label: string): string {
  return COLORS[label] ?? "gray";
}
