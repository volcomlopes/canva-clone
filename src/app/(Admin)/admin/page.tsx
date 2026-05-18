import {
  Building2Icon,
  UsersIcon,
  ImageIcon,
  TrendingUpIcon,
} from "lucide-react";

import { db } from "@/db/drizzle";
import { brands, dealerships, users } from "@/db/schema";

export default async function AdminDashboardPage() {
  // Busca dados reais do banco
  const allBrands = await db.select().from(brands);
  const allDealerships = await db.select().from(dealerships);
  const allUsers = await db.select().from(users);

  const stats = [
    {
      label: "Marcas Ativas",
      value: allBrands.filter((b) => b.active).length,
      total: allBrands.length,
      icon: Building2Icon,
      color: "blue",
    },
    {
      label: "Unidades",
      value: allDealerships.filter((d) => d.active).length,
      total: allDealerships.length,
      icon: ImageIcon,
      color: "green",
    },
    {
      label: "Usuários",
      value: allUsers.length,
      total: allUsers.length,
      icon: UsersIcon,
      color: "purple",
    },
    {
      label: "Crescimento",
      value: "+0%",
      total: 0,
      icon: TrendingUpIcon,
      color: "orange",
    },
  ];

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Bem-vindo ao Artbase Admin 👋
        </h2>
        <p className="text-slate-500 text-sm">
          Gerencie marcas, unidades e usuários da plataforma.
        </p>
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

      {/* Seção de informação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-2">
          🚀 Próximos passos
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Esta é a estrutura base do Painel Admin. Nas próximas sessões vamos:
        </p>
        <ul className="text-sm text-slate-600 space-y-1 ml-5 list-disc">
          <li>Construir a tela de listagem de Marcas</li>
          <li>Criar formulário para adicionar novas marcas</li>
          <li>Implementar edição e desativação de marcas</li>
          <li>Adicionar visualização detalhada de cada marca</li>
        </ul>
      </div>
    </div>
  );
}