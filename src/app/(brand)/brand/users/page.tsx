import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  PlusIcon,
  UsersIcon,
  MailIcon,
  StoreIcon,
  ShieldIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { users, dealerships } from "@/db/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Helper: formata role em português
const formatRole = (role: string): string => {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    brand_admin: "Admin da Marca",
    dealership_admin: "Admin da Unidade",
    user: "Vendedor",
  };
  return map[role] || role;
};

// Helper: cor do badge baseado no role
const getRoleVariant = (role: string): "default" | "secondary" | "outline" => {
  if (role === "super_admin") return "default";
  if (role === "brand_admin") return "default";
  if (role === "dealership_admin") return "secondary";
  return "outline";
};

// Helper: ícone do role
const getRoleIcon = (role: string) => {
  if (role === "brand_admin") return ShieldIcon;
  if (role === "dealership_admin") return StoreIcon;
  return UsersIcon;
};

export default async function BrandUsersPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  // 🔍 Busca usuários DA MARCA do user logado (multi-tenant!)
  const brandUsers = await db
    .select()
    .from(users)
    .where(eq(users.brandId, brandId!));

  // 🏢 Busca todas as unidades da marca (pra mostrar o nome da unidade do user)
  const brandDealerships = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.brandId, brandId!));

  // Cria um mapa "id da unidade → nome"
  const dealershipMap = new Map(
    brandDealerships.map((d) => [d.id, d.name])
  );

  // Agrupa contadores por role
  const counts = {
    total: brandUsers.length,
    brandAdmins: brandUsers.filter((u) => u.role === "brand_admin").length,
    dealershipAdmins: brandUsers.filter((u) => u.role === "dealership_admin").length,
    users: brandUsers.filter((u) => u.role === "user").length,
  };

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Usuários
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie as pessoas que têm acesso à sua marca.
          </p>
        </div>

        <Button disabled title="Em breve">
          <PlusIcon className="size-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {/* Cards de stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Admin da Marca</p>
          <p className="text-2xl font-bold text-slate-900">{counts.brandAdmins}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Admin Unidade</p>
          <p className="text-2xl font-bold text-slate-900">{counts.dealershipAdmins}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Vendedores</p>
          <p className="text-2xl font-bold text-slate-900">{counts.users}</p>
        </div>
      </div>

      {/* Lista de Usuários */}
      {brandUsers.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <UsersIcon className="size-12 mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">
            Nenhum usuário cadastrado
          </h3>
          <p className="text-sm text-slate-500">
            Comece convidando os primeiros usuários da sua marca.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {brandUsers.map((user) => {
            const RoleIcon = getRoleIcon(user.role);
            const dealershipName = user.dealershipId 
              ? dealershipMap.get(user.dealershipId) 
              : null;

            return (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                {/* Esquerda: Avatar + Info */}
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
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
                    {dealershipName && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <StoreIcon className="size-3" />
                        {dealershipName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Direita: Role Badge */}
                <div className="flex items-center gap-3">
                  <Badge variant={getRoleVariant(user.role)} className="gap-1">
                    <RoleIcon className="size-3" />
                    {formatRole(user.role)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info bottom */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          💡 <strong>Em breve:</strong> sistema de convite por email, gerenciamento de permissões, e ações em lote.
        </p>
      </div>
    </div>
  );
}