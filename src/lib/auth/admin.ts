import "server-only";

export function getAllowedAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function isAllowedAdminEmail(email: string | null | undefined) {
  const allowedEmail = getAllowedAdminEmail();

  if (!allowedEmail || !email) {
    return false;
  }

  return email.trim().toLowerCase() === allowedEmail;
}

export function getAuthBaseUrl() {
  return process.env.APP_URL?.trim() || "http://localhost:3000";
}

export function getAuthSecret() {
  return process.env.AUTH_SECRET?.trim() || undefined;
}
