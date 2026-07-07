export const STUDENT_LOGIN_DOMAIN = "kunokhanya.co.za";

export function studentLoginEmail(studentNumber: string): string {
  return `${studentNumber.trim().toLowerCase()}@${STUDENT_LOGIN_DOMAIN}`;
}

/** Password scheme: last name, lowercased, zero-padded to 6 chars if shorter (matches the historical bulk import). */
export function deriveStudentPassword(fullName: string): string {
  const tokens = fullName.trim().split(/\s+/);
  const surname = tokens[tokens.length - 1] || "student";
  let password = surname.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (password.length < 6) {
    password = password + "0".repeat(6 - password.length);
  }
  return password;
}
