"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brands } from "@/db/schema";

interface ToggleBrandStatusInput {
  id: string;
  active: boolean; // novo status desejado
}

export async function toggleBrandStatus(input: ToggleBrandStatusInput) {
  // 🔒 Verifica permissão
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return { error: "Acesso negado" };
  }

  try {
    // 💾 Atualiza no banco
    await db
      .update(brands)
      .set({ active: input.active })
      .where(eq(brands.id, input.id));

    // 🔄 Atualiza páginas
    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${input.id}`);

    return { success: true };
  } catch (error) {
    return { error: "Erro ao alterar status da marca." };
  }
}