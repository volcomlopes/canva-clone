"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brands } from "@/db/schema";

interface CreateBrandInput {
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
}

export async function createBrand(input: CreateBrandInput) {
  // 🔒 Verifica permissão
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return { error: "Acesso negado" };
  }

  // ✅ Validações básicas
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
    // 💾 Insere no banco
    const [newBrand] = await db
      .insert(brands)
      .values({
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        primaryColor: input.primaryColor || "#3B82F6",
        secondaryColor: input.secondaryColor || "#1E293B",
        active: true,
      })
      .returning();

    // 🔄 Atualiza listagem
    revalidatePath("/admin/brands");

    return { success: true, brandId: newBrand.id };
  } catch (error: any) {
    // Erro comum: slug duplicado
    if (error?.message?.includes("unique")) {
      return { error: "Já existe uma marca com esse slug. Tente outro." };
    }
    return { error: "Erro ao criar marca. Tente novamente." };
  }
}