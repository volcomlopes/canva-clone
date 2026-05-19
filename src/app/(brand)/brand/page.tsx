import { eq, count } from "drizzle-orm";
import {
  StoreIcon,
  UsersIcon,
  ImageIcon,
  TrendingUpIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brands, dealerships, users } from "@/db/schema";

export default async function BrandDashboardPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  // Busca dados da marca do usuário
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, brandId!))
    .limit(1);

  // Conta unidades dessa marca
  const dealershipsCount = await db
    .select({ count: count() })
    .from(dealerships)
    .where(eq(dealerships.brandId, brandId!));

  // Conta usuários dessa marca
  const usersCount = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.brandId, brandId!));

  const stats = [
    {
      label: "Unidades",
      value: dealershipsCount[0]?.count || 0,
      icon: StoreIcon,
      color: "blue",
    },
    {
      label: "Usuários",
      value: usersCount[0]?.count || 0,
      icon: UsersIcon,
      color: "green",
    },
    {
      label: "Assets",
      value: 0,
      icon: ImageIcon,
      color: "purple",
    },
    {
      label: "Crescimento",
      value: "+0%",
      icon: TrendingUpIcon,
      color: "orange",
    },
  ];

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      {/* Header da Marca */}
      <div className="mb-8 flex items-center gap-4">
        <div
          className="size-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
          style={{ backgroundColor: brand?.primaryColor || "#3B82F6" }}
        >
          {brand?.name.charAt(0) || "?"}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {brand?.name || "Sua marca"}
          </h2>
          <p className="text-slate-500 text-sm">
            Bem-vindo ao painel de gerenciamento da {brand?.name}.
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-md bg-${stat.color}-50`}>
                <stat.icon className={`size-5 text-${stat.color}-600`} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info de próximos passos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-2">
          🚀 Estamos construindo
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Nas próximas sessões, este painel vai ganhar:
        </p>
        <ul className="text-sm text-slate-600 space-y-1 ml-5 list-disc">
          <li>Gerenciamento de unidades (concessionárias)</li>
          <li>Gerenciamento de usuários da marca</li>
          <li>Biblioteca de imagens oficiais (modelos, logos, etc.)</li>
          <li>Brand Kit (cores, fontes, regras)</li>
          <li>Convidar novos usuários por email</li>
        </ul>
      </div>
    </div>
  );
}