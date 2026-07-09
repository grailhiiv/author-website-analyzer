export function canAccessAdminRoute({
  allowedAdminEmail,
  userEmail,
}: {
  allowedAdminEmail: string | null | undefined;
  userEmail: string | null | undefined;
}) {
  const allowedEmail = allowedAdminEmail?.trim().toLowerCase();
  const email = userEmail?.trim().toLowerCase();

  return Boolean(allowedEmail && email && allowedEmail === email);
}

export function getAdminRouteAccess({
  allowedAdminEmail,
  userEmail,
}: {
  allowedAdminEmail: string | null | undefined;
  userEmail: string | null | undefined;
}) {
  const allowed = canAccessAdminRoute({ allowedAdminEmail, userEmail });

  return {
    allowed,
    redirectTo: allowed ? null : "/admin/login",
  };
}
