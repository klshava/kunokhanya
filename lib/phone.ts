/** Normalizes a South African phone number to E.164 digits (no "+"), e.g. "082 123 4567" -> "27821234567". */
export function toSouthAfricanDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("27")) {
    digits = digits.slice(2);
  }
  return `27${digits}`;
}

/** wa.me deep link that opens a WhatsApp chat with the number, regardless of whether it's confirmed to be on WhatsApp. */
export function whatsAppLink(raw: string): string {
  return `https://wa.me/${toSouthAfricanDigits(raw)}`;
}
