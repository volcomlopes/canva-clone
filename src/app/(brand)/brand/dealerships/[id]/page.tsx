import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import {
  ArrowLeftIcon,
  StoreIcon,
  UsersIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  HomeIcon,
  FileTextIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { dealerships, users } from "@/db/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DealershipStatusButton } from "../../../_components/dealership-status-button";

interface DealershipDetailsPageProps {
  params: {
    id: string;
  };
}

const formatRole = (role: string): string => {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    brand_admin: "Admin da Marca",
    dealership_admin: "Admin da Unidade",
    user: "Vendedor",
  };
  return map[role] || role;
};

const formatCNPJ = (cnpj: string | null): string => {
  if (!cnpj) return "";
  const numbers = cnpj.replace(/\D/g, "");
  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatPhone = (phone: string | null): string => {
  if (!phone) return "";
  const numbers = phone.replace(/\D/g, "");
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};

export default async function DealershipDetailsPage({
  params,
}: DealershipDetailsPageProps) {
  const session = await auth();
  const brandId = session?.user?.brandId;

  const [dealership] = await db
    .select()
    .from(dealerships)
    .where(
      and(
        eq(dealerships.id, params.id),
        eq(dealerships.brandId, brandId!)
      )
    )
    .limit(1);

  if (!dealership) {
    notFound();
  }

  const dealershipUsers = await db
    .select()
    .from(users)
    .where(eq(users.dealershipId, dealership.id));

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      <Link
        href="/brand/dealerships"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar para unidades
      </Link>

      <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-blue-50 flex items-center justify-center">
            <StoreIcon className="size-8 text-blue-600" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {dealership.name}
              </h1>
              <Badge variant={dealership.active ? "default" : "secondary"}>
                {dealership.active ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            {dealership.cnpj && (
              <p className="text-sm text-slate-500 font-mono">
                CNPJ: {formatCNPJ(dealership.cnpj)}
              </p>
            )}
            {dealership.createdAt && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <CalendarIcon className="size-3" />
                Criada em {new Date(dealership.createdAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/brand/dealerships/${dealership.id}/edit`}>
              ✏️ Editar
            </Link>
          </Button>
          <DealershipStatusButton
            dealershipId={dealership.id}
            dealershipName={dealership.name}
            isActive={dealership.active}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-md">
              <UsersIcon className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {dealershipUsers.length}
              </p>
              <p className="text-sm text-slate-500">Usuários</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-md">
              <FileTextIcon className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-sm text-slate-500">Artes criadas</p>
            </div>
          </div>
        </div>
      </div>

      {(dealership.address || dealership.city || dealership.phone) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <MapPinIcon className="size-5" />
            Contato e Localização
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            {dealership.address && (
              <div className="flex items-start gap-3">
                <HomeIcon className="size-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Endereço</p>
                  <p className="text-sm font-medium text-slate-900">
                    {dealership.address}
                  </p>
                </div>
              </div>
            )}
            {(dealership.city || dealership.state) && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="size-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Cidade / Estado</p>
                  <p className="text-sm font-medium text-slate-900">
                    {[dealership.city, dealership.state].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>
            )}
            {dealership.phone && (
              <div className="flex items-start gap-3">
                <PhoneIcon className="size-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Telefone</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatPhone(dealership.phone)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <UsersIcon className="size-5" />
          Usuários ({dealershipUsers.length})
        </h2>

        {dealershipUsers.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-8 text-center">
            <UsersIcon className="size-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">
              Nenhum usuário associado a esta unidade ainda
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {dealershipUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {user.name || "Sem nome"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MailIcon className="size-3" />
                      {user.email}
                    </p>
                  </div>
                </div>
                <Badge variant={user.role === "dealership_admin" ? "default" : "outline"}>
                  {formatRole(user.role)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}