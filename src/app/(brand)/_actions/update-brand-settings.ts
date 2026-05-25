"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brands } from "@/db/schema";

interface UpdateBrandSettingsInput {
  showTemplateControls?: boolean;
}

export async function updateBrandSettings(input: UpdateBrandSettingsInput) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  try {
    await db
      .update(brands)
      .set({
        showTemplateControls: input.showTemplateControls,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, brandId));

    revalidatePath("/brand/settings");

    return { success: true };
  } catch (error) {
    return { error: "Erro ao salvar configuracoes" };
  }
}