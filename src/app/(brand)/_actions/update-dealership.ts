"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { dealerships } from "@/db/schema";

interface UpdateDealershipInput {
  id: string;
  name: string;
  cnpj?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
}

export async function updateDealership(input: UpdateDealershipInput) {
  // 🔒 Verifica permissão
  const session = await auth();
  if (!session?.user || session.user.role !== "brand_admin") {
    return { error: "Acesso negado" };
  }

  const brandId = session.user.brandId;
  if (!brandId) {
    return { error: "Marca não identificada" };
  }

  // ✅ Validações
  if (!input.name.trim()) {
    return { error: "Nome é obrigatório" };
  }
  if (input.cnpj && input.cnpj.replace(/\D/g, "").length !== 14) {
    return { error: "CNPJ deve ter 14 dígitos" };
  }

  try {
    // 🛡️ Atualiza SÓ se for da marca do user
    await db
      .update(dealerships)
      .set({
        name: input.name.trim(),
        cnpj: input.cnpj?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
      })
      .where(
        and(
          eq(dealerships.id, input.id),
          eq(dealerships.brandId, brandId)
        )
      );

    revalidatePath("/brand/dealerships");
    revalidatePath(`/brand/dealerships/${input.id}`);

    return { success: true };
  } catch (error: any) {
    if (error?.message?.includes("unique")) {
      return { error: "Já existe outra unidade com esse CNPJ." };
    }
    return { error: "Erro ao atualizar unidade." };
  }
}