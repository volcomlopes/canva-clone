"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { dealerships } from "@/db/schema";

interface ToggleDealershipStatusInput {
  id: string;
  active: boolean;
}

export async function toggleDealershipStatus(input: ToggleDealershipStatusInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca não identificada" };
  }

  try {
    await db
      .update(dealerships)
      .set({ active: input.active })
      .where(
        and(
          eq(dealerships.id, input.id),
          eq(dealerships.brandId, brandId)
        )
      );

    revalidatePath("/brand/dealerships");
    revalidatePath(`/brand/dealerships/${input.id}`);

    return { success: true };
  } catch (error) {
    return { error: "Erro ao alterar status da unidade." };
  }
}