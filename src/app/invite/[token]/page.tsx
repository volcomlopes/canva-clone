import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ShieldCheckIcon, Building2Icon, StoreIcon, MailIcon } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { invites, brands, dealerships } from "@/db/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { AcceptInviteButton } from "./_components/accept-invite-button";

interface InvitePageProps {
  params: {
    token: string;
  };
}

const formatRole = (role: string): string => {
  const map: Record<string, string> = {
    brand_admin: "Admin da Marca",
    dealership_admin: "Admin da Unidade",
    user: "Vendedor",
  };
  return map[role] || role;
};

export default async function InvitePage({ params }: InvitePageProps) {
  // Busca o convite
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, params.token))
    .limit(1);

  // Se nao existe ou ja foi aceito ou expirou
  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="size-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="size-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Convite invalido
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Este link nao existe ou foi cancelado.
          </p>
          <Button asChild>
            <Link href="/">Voltar para o inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (invite.accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="size-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="size-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Convite ja aceito
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Este convite ja foi usado.
          </p>
          <Button asChild>
            <Link href="/">Ir para o app</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="size-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="size-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Convite expirado
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Este convite expirou. Peca ao admin pra enviar um novo.
          </p>
          <Button asChild>
            <Link href="/">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Busca dados da marca
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, invite.brandId!))
    .limit(1);

  // Busca unidade se tiver
  let dealership = null;
  if (invite.dealershipId) {
    const [d] = await db
      .select()
      .from(dealerships)
      .where(eq(dealerships.id, invite.dealershipId))
      .limit(1);
    dealership = d;
  }

  // Verifica se usuario esta logado
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const emailMatches = isLoggedIn && session.user.email?.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8">
        {/* Logo da marca */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="size-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg"
            style={{ backgroundColor: brand?.primaryColor || "#3B82F6" }}
          >
            {brand?.name.charAt(0) || "?"}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-slate-500 mb-1">Voce foi convidado para</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {brand?.name || "uma marca"}
          </h1>
          <p className="text-sm text-slate-600">
            no <strong>Artbase</strong>
          </p>
        </div>

        {/* Detalhes do convite */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <MailIcon className="size-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Email do convite</p>
              <p className="text-sm font-medium text-slate-900">{invite.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="size-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Permissao</p>
              <p className="text-sm font-medium text-slate-900">{formatRole(invite.role)}</p>
            </div>
          </div>

          {dealership && (
            <div className="flex items-center gap-3">
              <StoreIcon className="size-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Unidade</p>
                <p className="text-sm font-medium text-slate-900">{dealership.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Estados diferentes */}
        {!isLoggedIn ? (
          <>
            <p className="text-sm text-slate-600 text-center mb-4">
              Para aceitar, faca login com a conta Google do email <strong>{invite.email}</strong>
            </p>
            <Button asChild className="w-full">
              <Link href={`/sign-in?callbackUrl=/invite/${params.token}`}>
                Fazer login com Google
              </Link>
            </Button>
          </>
        ) : !emailMatches ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                Voce esta logado como <strong>{session.user.email}</strong>, mas o convite e para <strong>{invite.email}</strong>.
              </p>
            </div>
            <p className="text-xs text-slate-500 text-center mb-4">
              Faca logout e entre com a conta correta.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar</Link>
            </Button>
          </>
        ) : (
          <AcceptInviteButton token={params.token} />
        )}
      </div>
    </div>
  );
}