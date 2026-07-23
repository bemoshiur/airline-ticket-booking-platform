import { format } from "date-fns";

export function generateBookingReference(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${date}-${random}`;
}
