import "server-only";

/**
 * Moodle Web Services (REST) integration. Creates a Moodle account with the
 * same username/password as the student's Student Central login, so one set
 * of credentials works on both systems.
 *
 * Requires a Moodle external service scoped to core_user_create_users, with
 * a dedicated service-account user and a relaxed password policy (Site
 * administration > Security > Site policies) matching deriveStudentPassword's
 * scheme (lowercase letters + digits, 6 chars, no upper/special required) --
 * otherwise Moodle will reject the password Supabase already accepted.
 */

interface MoodleErrorResponse {
  exception?: string;
  errorcode?: string;
  message?: string;
}

async function callMoodle<T>(wsfunction: string, params: Record<string, string>): Promise<T> {
  const baseUrl = process.env.MOODLE_BASE_URL;
  const token = process.env.MOODLE_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("Moodle integration is not configured (MOODLE_BASE_URL / MOODLE_API_TOKEN missing)");
  }

  const body = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
    ...params,
  });

  const res = await fetch(`${baseUrl}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();

  // core_user_delete_users and similar functions return a bare `null` on
  // success -- guard before the `in` check below, since `typeof null` is
  // "object" and `"exception" in null` throws.
  if (data !== null && typeof data === "object" && "exception" in data) {
    const err = data as MoodleErrorResponse;
    throw new Error(`Moodle error (${err.errorcode ?? "unknown"}): ${err.message ?? err.exception}`);
  }

  return data as T;
}

/** Plain student number, lowercased -- the Moodle username scheme. */
export function moodleUsername(studentNumber: string): string {
  return studentNumber.trim().toLowerCase();
}

/**
 * Creates a Moodle account for a student. Username is the plain student
 * number (lowercase) -- Moodle usernames don't need to be email-shaped like
 * Supabase's synthetic login emails do. Returns the new Moodle user id.
 */
export async function createMoodleUser({
  studentNumber,
  password,
  fullName,
  email,
}: {
  studentNumber: string;
  password: string;
  fullName: string;
  email: string;
}): Promise<{ moodleUserId: number; username: string }> {
  const tokens = fullName.trim().split(/\s+/);
  const firstName = tokens.slice(0, -1).join(" ") || fullName;
  const lastName = tokens[tokens.length - 1] || fullName;
  const username = moodleUsername(studentNumber);

  const result = await callMoodle<[{ id: number; username: string }]>("core_user_create_users", {
    "users[0][username]": username,
    "users[0][password]": password,
    "users[0][firstname]": firstName,
    "users[0][lastname]": lastName,
    "users[0][email]": email,
  });

  return { moodleUserId: result[0].id, username };
}

/**
 * Deletes a Moodle account by id. Requires core_user_delete_users to be
 * added to the external service (Site administration > Server > Web
 * services > External services > Student Central Integration > Functions).
 */
export async function deleteMoodleUser(moodleUserId: number): Promise<void> {
  await callMoodle("core_user_delete_users", {
    "userids[0]": String(moodleUserId),
  });
}
