"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brands } from "@/db/schema";

interface UpdateBrandInput {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
}

export async function updateBrand(input: UpdateBrandInput) {
  // 🔒 Verifica permissão
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return { error: "Acesso negado" };
  }

  // ✅ Validações
  if (!input.name.trim()) {
    return { error: "Nome é obrigatório" };
  }
  if (!input.slug.trim()) {
    return { error: "Slug é obrigatório" };
  }
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return { error: "Slug deve conter apenas letras minúsculas, números e hífens" };
  }

  try {
    // 💾 Atualiza no banco
    await db
      .update(brands)
      .set({
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        primaryColor: input.primaryColor || "#3B82F6",
        secondaryColor: input.secondaryColor || "#1E293B",
      })
      .where(eq(brands.id, input.id));

    // 🔄 Atualiza páginas relacionadas
    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${input.id}`);

    return { success: true };
  } catch (error: any) {
    if (error?.message?.includes("unique")) {
      return { error: "Já existe outra marca com esse slug." };
    }
    return { error: "Erro ao atualizar marca. Tente novamente." };
  }
}