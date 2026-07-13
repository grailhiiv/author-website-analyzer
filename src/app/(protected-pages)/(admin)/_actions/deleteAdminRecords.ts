"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAllowedAdminEmail } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

const selectedIdsSchema = z
  .array(z.string().trim().min(1).max(64))
  .min(1, "Select at least one item to delete.")
  .max(100, "You can delete up to 100 items at a time.")
  .transform((ids) => [...new Set(ids)]);

async function requireAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !isAllowedAdminEmail(session.user.email)) {
    redirect("/login");
  }
}

function revalidateAdminLists() {
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/leads");
}

export async function deleteReportsAction(selectedIds: string[]) {
  await requireAdminSession();

  const ids = selectedIdsSchema.parse(selectedIds);
  const result = await prisma.report.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  revalidateAdminLists();

  return { deletedCount: result.count };
}

export async function deleteLeadsAction(selectedIds: string[]) {
  await requireAdminSession();

  const ids = selectedIdsSchema.parse(selectedIds);
  const result = await prisma.lead.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  revalidateAdminLists();

  return { deletedCount: result.count };
}
