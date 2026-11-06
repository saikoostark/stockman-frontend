/**
 * Provider/instrument availability states. The backend is authoritative; any
 * value other than the three known states is displayed as UNAVAILABLE.
 */
export type Availability = "AVAILABLE" | "UNAVAILABLE" | "BACKOFF";

export function normalizeAvailability(value: string): Availability {
  return value === "AVAILABLE" || value === "BACKOFF" ? value : "UNAVAILABLE";
}

export function availabilityBadgeVariant(
  availability: Availability,
): "default" | "destructive" | "secondary" {
  switch (availability) {
    case "AVAILABLE":
      return "default";
    case "BACKOFF":
      return "secondary";
    case "UNAVAILABLE":
      return "destructive";
  }
}
