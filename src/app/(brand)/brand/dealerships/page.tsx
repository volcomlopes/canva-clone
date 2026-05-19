import Link from "next/link";
import { eq, count } from "drizzle-orm";
import {
  PlusIcon,
  Building2Icon,
  UsersIcon,
  MapPinIcon,
  StoreIcon,
  PhoneIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { dealerships, users } from "@/db/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function BrandDealershipsPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  // 🔍 Busca unidades DA MARCA do usuário (multi-tenant!)
  const allDealerships = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.brandId, brandId!));

  // Conta usuários por unidade
  const dealershipsWithStats = await Promise.all(
    allDealerships.map(async (dealership) => {
      const usersCount = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.dealershipId, dealership.id));

      return {
        ...dealership,
        usersCount: usersCount[0]?.count || 0,
      };
    })
  );

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Unidades
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie as concessionárias e unidades da sua marca.
          </p>
        </div>

        <Button asChild>
          <Link href="/brand/dealerships/new" className="gap-2">
            <PlusIcon className="size-4" />
            Nova Unidade
          </Link>
        </Button>
      </div>

      {/* Estado vazio ou listagem */}
      {dealershipsWithStats.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <Building2Icon className="size-12 mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">
            Nenhuma unidade cadastrada
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Comece adicionando sua primeira concessionária ou unidade.
          </p>
          <Button asChild>
            <Link href="/brand/dealerships/new" className="gap-2">
              <PlusIcon className="size-4" />
              Criar primeira unidade
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealershipsWithStats.map((dealership) => (
            <Link
              key={dealership.id}
              href={`/brand/dealerships/${dealership.id}`}
              className="group bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all"
            >
              {/* Cabeçalho */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <StoreIcon className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {dealership.name}
                    </h3>
                    {dealership.cnpj && (
                      <p className="text-xs text-slate-500 font-mono">
                        {dealership.cnpj}
                      </p>
                    )}
                  </div>
                </div>

                <Badge variant={dealership.active ? "default" : "secondary"}>
                  {dealership.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              {/* Detalhes */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                {(dealership.city || dealership.state) && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPinIcon className="size-3.5 text-slate-400" />
                    <span>
                      {[dealership.city, dealership.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}

                {dealership.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <PhoneIcon className="size-3.5 text-slate-400" />
                    <span>{dealership.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <UsersIcon className="size-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900">
                    {dealership.usersCount}
                  </span>
                  <span>usuário{dealership.usersCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}