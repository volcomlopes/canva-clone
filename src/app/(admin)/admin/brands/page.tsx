import Link from "next/link";
import { eq, sql, count } from "drizzle-orm";
import {
  PlusIcon,
  Building2Icon,
  UsersIcon,
  StoreIcon,
} from "lucide-react";

import { db } from "@/db/drizzle";
import { brands, dealerships, users } from "@/db/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function BrandsPage() {
  // Busca todas as marcas
  const allBrands = await db.select().from(brands);

  // Para cada marca, busca quantidade de unidades e usuários
  const brandsWithStats = await Promise.all(
    allBrands.map(async (brand) => {
      const dealershipsCount = await db
        .select({ count: count() })
        .from(dealerships)
        .where(eq(dealerships.brandId, brand.id));

      const usersCount = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.brandId, brand.id));

      return {
        ...brand,
        dealershipsCount: dealershipsCount[0]?.count || 0,
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
            Marcas
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie as marcas clientes da plataforma Artbase.
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/brands/new" className="gap-2">
            <PlusIcon className="size-4" />
            Nova Marca
          </Link>
        </Button>
      </div>

      {/* Cards de marcas */}
      {brandsWithStats.length === 0 ? (
        // Estado vazio
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <Building2Icon className="size-12 mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">
            Nenhuma marca cadastrada
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Comece adicionando sua primeira marca-cliente.
          </p>
          <Button asChild>
            <Link href="/admin/brands/new" className="gap-2">
              <PlusIcon className="size-4" />
              Criar primeira marca
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandsWithStats.map((brand) => (
            <Link
              key={brand.id}
              href={`/admin/brands/${brand.id}`}
              className="group bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all"
            >
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Logo ou inicial */}
                  {brand.logoUrl ? (
                    <div
                      className="size-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: brand.primaryColor || "#3B82F6" }}
                    >
                      {brand.name.charAt(0)}
                    </div>
                  ) : (
                    <div
                      className="size-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: brand.primaryColor || "#3B82F6" }}
                    >
                      {brand.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {brand.name}
                    </h3>
                    <p className="text-xs text-slate-500">{brand.slug}</p>
                  </div>
                </div>

                <Badge variant={brand.active ? "default" : "secondary"}>
                  {brand.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <StoreIcon className="size-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {brand.dealershipsCount}
                    </p>
                    <p className="text-xs text-slate-500">unidades</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="size-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {brand.usersCount}
                    </p>
                    <p className="text-xs text-slate-500">usuários</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}