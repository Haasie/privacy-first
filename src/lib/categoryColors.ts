const COLORS: Record<string, string> = {
  private_person: "blue",
  private_email: "teal",
  private_phone: "orange",
  private_address: "grape",
  private_id: "red",
  private_url: "cyan",
  private_date: "yellow",
  private_organization: "pink",
  account_number: "red",
};

export function colorForLabel(label: string): string {
  return COLORS[label] ?? "gray";
}

/** CSS background color with opacity for inline highlights. */
const BG: Record<string, string> = {
  private_person:     "rgba(34,139,230,0.25)",
  private_email:      "rgba(18,184,134,0.25)",
  private_phone:      "rgba(253,126,20,0.25)",
  private_address:    "rgba(174,62,201,0.25)",
  private_id:         "rgba(250,82,82,0.25)",
  private_url:        "rgba(21,170,191,0.25)",
  private_date:       "rgba(250,176,5,0.25)",
  private_organization:"rgba(240,101,149,0.25)",
  account_number:     "rgba(250,82,82,0.25)",
};

export function bgForLabel(label: string): string {
  return BG[label] ?? "rgba(130,130,130,0.2)";
}

const DUTCH: Record<string, string> = {
  private_person:       "Persoon",
  private_email:        "E-mailadres",
  private_phone:        "Telefoonnummer",
  private_address:      "Adres",
  private_id:           "Identificatie",
  private_url:          "Website",
  private_date:         "Datum",
  private_organization: "Organisatie",
  account_number:       "Rekeningnummer",
};

export function dutchLabel(label: string): string {
  return DUTCH[label] ?? label.replace("private_", "").replace(/_/g, " ");
}
