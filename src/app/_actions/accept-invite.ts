"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { invites, users } from "@/db/schema";

interface AcceptInviteResult {
  error?: string;
  success?: boolean;
}

export async function acceptInvite(token: string): Promise<AcceptInviteResult> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: "Voce precisa fazer login primeiro" };
  }

  // Busca o convite
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (!invite) {
    return { error: "Convite invalido ou expirado" };
  }

  if (invite.accepted) {
    return { error: "Este convite ja foi aceito" };
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return { error: "Este convite expirou" };
  }

  // Verifica se o email do convite bate com o email do usuario logado
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { 
      error: "Este convite e para " + invite.email + ". Voce esta logado como " + session.user.email + ". Faca logout e login com o email correto." 
    };
  }

  try {
    // Atualiza o usuario com brand e role
    await db
      .update(users)
      .set({
        role: invite.role,
        brandId: invite.brandId,
        dealershipId: invite.dealershipId,
      })
      .where(eq(users.email, session.user.email));

    // Marca convite como aceito
    await db
      .update(invites)
      .set({ accepted: true })
      .where(eq(invites.id, invite.id));

    return { success: true };
  } catch (error) {
    return { error: "Erro ao processar convite. Tente novamente." };
  }
}