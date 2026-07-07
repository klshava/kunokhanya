/**
 * Random initial password for a new staff login (registrar/facilitator/admin).
 * Unlike deriveStudentPassword, this is not derived from their name -- staff
 * accounts can carry write access to financial data, so a guessable password
 * scheme is a bigger risk here than for a read-only student portal account.
 */
export function generateStaffPassword(length = 10): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // no ambiguous chars (0/O, 1/l/I)
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
