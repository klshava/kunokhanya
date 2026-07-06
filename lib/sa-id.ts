/**
 * South African ID number validation.
 * Format: YYMMDD SSSS C A Z  (13 digits)
 *  - YYMMDD    : date of birth
 *  - SSSS      : gender sequence (0000-4999 female, 5000-9999 male)
 *  - C         : citizenship (0 = SA citizen, 1 = permanent resident)
 *  - A         : usually 8 or 9 (historically "race" digit, now unused/8)
 *  - Z         : Luhn checksum digit
 */

export interface SAIdResult {
  valid: boolean;
  reason?: string;
  dateOfBirth?: string; // ISO yyyy-mm-dd
  gender?: "male" | "female";
  citizen?: boolean;
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function validateSAId(idNumber: string): SAIdResult {
  const id = (idNumber || "").trim();

  if (!/^\d{13}$/.test(id)) {
    return { valid: false, reason: "ID number must be exactly 13 digits" };
  }

  const yy = parseInt(id.slice(0, 2), 10);
  const mm = parseInt(id.slice(2, 4), 10);
  const dd = parseInt(id.slice(4, 6), 10);

  if (mm < 1 || mm > 12) {
    return { valid: false, reason: "ID number contains an invalid month" };
  }
  const daysInMonth = new Date(2000, mm, 0).getDate();
  if (dd < 1 || dd > daysInMonth) {
    return { valid: false, reason: "ID number contains an invalid day" };
  }

  if (!luhnCheck(id)) {
    return { valid: false, reason: "ID number checksum is invalid" };
  }

  // Assume 00-24 => 2000s, 25-99 => 1900s. Adjust the cutoff as years pass.
  const currentYY = new Date().getFullYear() % 100;
  const century = yy > (currentYY + 5) % 100 ? 1900 : 2000;
  const fullYear = century + yy;
  const dateOfBirth = `${fullYear.toString().padStart(4, "0")}-${mm
    .toString()
    .padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;

  const genderDigits = parseInt(id.slice(6, 10), 10);
  const gender: "male" | "female" = genderDigits >= 5000 ? "male" : "female";

  const citizen = id[10] === "0";

  return { valid: true, dateOfBirth, gender, citizen };
}
