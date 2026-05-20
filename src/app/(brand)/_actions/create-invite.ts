"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { invites, users, dealerships } from "@/db/schema";

interface CreateInviteInput {
  email: string;
  role: "brand_admin" | "dealership_admin" | "user";
  dealershipId?: string;
}

// Gera token aleatório seguro
const generateToken = (): string => {
  return crypto.randomUUID().replace(/-/g, "");
};

export async function createInvite(input: CreateInviteInput) {
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
  const email = input.email.trim().toLowerCase();

  if (!email) {
    return { error: "Email é obrigatório" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email inválido" };
  }

  // Verifica se já tem usuário com esse email na marca
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser && existingUser.brandId === brandId) {
    return { error: "Esse email já é usuário da sua marca" };
  }

  // Verifica se já tem convite pendente
  const [existingInvite] = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.email, email),
        eq(invites.brandId, brandId),
        eq(invites.accepted, false)
      )
    )
    .limit(1);

  if (existingInvite) {
    return { error: "Já existe um convite pendente pra esse email" };
  }

  // Se passou dealershipId, valida que pertence à marca
  if (input.dealershipId) {
    const [dealership] = await db
      .select()
      .from(dealerships)
      .where(
        and(
          eq(dealerships.id, input.dealershipId),
          eq(dealerships.brandId, brandId)
        )
      )
      .limit(1);

    if (!dealership) {
      return { error: "Unidade inválida" };
    }
  }

  try {
    // Token expira em 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [newInvite] = await db
      .insert(invites)
      .values({
        email,
        role: input.role,
        brandId,
        dealershipId: input.dealershipId || null,
        token: generateToken(),
        accepted: false,
        expiresAt,
      })
      .returning();

    revalidatePath("/brand/users");

    return {
      success: true,
      token: newInvite.token,
      inviteId: newInvite.id,
    };
  } catch (error) {
    return { error: "Erro ao criar convite. Tente novamente." };
  }
}