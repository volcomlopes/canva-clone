"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { invites } from "@/db/schema";

export async function cancelInvite(inviteId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca não identificada" };
  }

  try {
    // 🛡️ Só deleta se for da marca do user
    await db
      .delete(invites)
      .where(
        and(
          eq(invites.id, inviteId),
          eq(invites.brandId, brandId)
        )
      );

    revalidatePath("/brand/users");

    return { success: true };
  } catch (error) {
    return { error: "Erro ao cancelar convite." };
  }
}