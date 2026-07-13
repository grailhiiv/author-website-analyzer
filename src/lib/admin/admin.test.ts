import assert from "node:assert/strict";
import test from "node:test";

import { getAdminRouteAccess } from "@/lib/admin/access";
import {
  adminLeadTableColumns,
  adminReportTableColumns,
} from "@/lib/admin/table-config";

test("admin protected routes redirect unauthenticated visitors", () => {
  const access = getAdminRouteAccess({
    allowedAdminEmail: "admin@grailhiiv.test",
    userEmail: null,
  });

  assert.equal(access.allowed, false);
  assert.equal(access.redirectTo, "/login");
});

test("admin protected routes allow the configured admin email", () => {
  const access = getAdminRouteAccess({
    allowedAdminEmail: "Admin@GrailHiiv.test",
    userEmail: " admin@grailhiiv.test ",
  });

  assert.equal(access.allowed, true);
  assert.equal(access.redirectTo, null);
});

test("admin protected routes reject a non-admin email", () => {
  const access = getAdminRouteAccess({
    allowedAdminEmail: "admin@grailhiiv.test",
    userEmail: "author@example.com",
  });

  assert.equal(access.allowed, false);
  assert.equal(access.redirectTo, "/login");
});

test("admin report table includes the requested columns", () => {
  assert.deepEqual([...adminReportTableColumns], [
    "Website",
    "Status",
    "Overall score",
    "Created date",
    "View report",
  ]);
});

test("admin lead table includes the requested columns", () => {
  assert.deepEqual([...adminLeadTableColumns], [
    "Full Name",
    "Email",
    "Website URL",
    "Marketing consent",
    "Lead status",
    "Created date",
    "View report",
  ]);
});
