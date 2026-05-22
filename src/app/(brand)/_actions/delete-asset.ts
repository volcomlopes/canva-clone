"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandAssets } from "@/db/schema";

export async function deleteAsset(assetId: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  if (!assetId) {
    return { error: "Asset invalido" };
  }

  try {
    const [deleted] = await db
      .delete(brandAssets)
      .where(
        and(
          eq(brandAssets.id, assetId),
          eq(brandAssets.brandId, brandId)
        )
      )
      .returning();

    if (!deleted) {
      return { error: "Asset nao encontrado" };
    }

    revalidatePath("/brand/assets");

    return { success: true };
  } catch (error) {
    return { error: "Erro ao deletar asset" };
  }
}