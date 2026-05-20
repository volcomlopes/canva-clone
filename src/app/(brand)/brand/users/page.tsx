import { eq, and } from "drizzle-orm";
import {
  UsersIcon,
  MailIcon,
  StoreIcon,
  ShieldIcon,
  ClockIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { users, dealerships, invites } from "@/db/schema";

import { Badge } from "@/components/ui/badge";

import { InviteUserModal } from "@/app/(brand)/_components/invite-user-modal";
import { PendingInvites } from "@/app/(brand)/_components/pending-invites";

const formatRole = (role: string): string => {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    brand_admin: "Admin da Marca",
    dealership_admin: "Admin da Unidade",
    user: "Vendedor",
  };
  return map[role] || role;
};

const getRoleVariant = (role: string): "default" | "secondary" | "outline" => {
  if (role === "super_admin") return "default";
  if (role === "brand_admin") return "default";
  if (role === "dealership_admin") return "secondary";
  return "outline";
};

const getRoleIcon = (role: string) => {
  if (role === "brand_admin") return ShieldIcon;
  if (role === "dealership_admin") return StoreIcon;
  return UsersIcon;
};

export default async function BrandUsersPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  const brandUsers = await db
    .select()
    .from(users)
    .where(eq(users.brandId, brandId!));

  const brandDealerships = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.brandId, brandId!));

  const pendingInvites = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.brandId, brandId!),
        eq(invites.accepted, false)
      )
    );

  const dealershipMap = new Map(
    brandDealerships.map((d) => [d.id, d.name])
  );

  const counts = {
    total: brandUsers.length,
    brandAdmins: brandUsers.filter((u) => u.role === "brand_admin").length,
    dealershipAdmins: brandUsers.filter((u) => u.role === "dealership_admin").length,
    users: brandUsers.filter((u) => u.role === "user").length,
  };

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Usuários
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie as pessoas que têm acesso à sua marca.
          </p>
        </div>

        <InviteUserModal
          dealerships={brandDealerships.map((d) => ({ id: d.id, name: d.name }))}
        />
      </div>

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

      {pendingInvites.length > 0 && (
        <PendingInvites
          invites={pendingInvites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            dealershipName: i.dealershipId ? dealershipMap.get(i.dealershipId) || null : null,
            token: i.token,
            createdAt: i.createdAt,
            expiresAt: i.expiresAt,
          }))}
        />
      )}

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <UsersIcon className="size-4" />
          Usuários Ativos ({brandUsers.length})
        </h3>
      </div>

      {brandUsers.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <UsersIcon className="size-12 mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">
            Nenhum usuário ativo
          </h3>
          <p className="text-sm text-slate-500">
            Use o botão Convidar Usuário pra adicionar pessoas.
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
    </div>
  );
}