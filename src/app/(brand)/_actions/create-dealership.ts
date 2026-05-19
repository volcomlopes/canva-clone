"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { dealerships } from "@/db/schema";

interface CreateDealershipInput {
  name: string;
  cnpj?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
}

export async function createDealership(input: CreateDealershipInput) {
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

  // Validação básica de CNPJ (se informado)
  if (input.cnpj && input.cnpj.replace(/\D/g, "").length !== 14) {
    return { error: "CNPJ deve ter 14 dígitos" };
  }

  try {
    // 💾 Insere no banco — IMPORTANTE: brandId vem do JWT!
    const [newDealership] = await db
      .insert(dealerships)
      .values({
        brandId, // 🎯 vinculado à marca do usuário logado
        name: input.name.trim(),
        cnpj: input.cnpj?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        active: true,
      })
      .returning();

    // 🔄 Atualiza listagem
    revalidatePath("/brand/dealerships");

    return { success: true, dealershipId: newDealership.id };
  } catch (error: any) {
    if (error?.message?.includes("unique")) {
      return { error: "Já existe uma unidade com esse CNPJ." };
    }
    return { error: "Erro ao criar unidade. Tente novamente." };
  }
}