"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandSvgs } from "@/db/schema";

interface DeleteBrandSvgInput {
  id: string;
}

export async function deleteBrandSvg(input: DeleteBrandSvgInput) {
  const session = await auth();

  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca nao identificada" };
  }

  if (!input.id) {
    return { error: "Vetor nao informado" };
  }

  try {
    await db
      .delete(brandSvgs)
      .where(
        and(
          eq(brandSvgs.id, input.id),
          eq(brandSvgs.brandId, brandId)
        )
      );

    revalidatePath("/brand/svgs");

    return { success: true };
  } catch (error) {
    return { error: "Erro ao excluir vetor. Tente novamente." };
  }
}