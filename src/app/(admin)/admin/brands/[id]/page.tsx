import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  ArrowLeftIcon,
  Building2Icon,
  StoreIcon,
  UsersIcon,
  ImageIcon,
  MailIcon,
  CalendarIcon,
  MapPinIcon,
} from "lucide-react";

import { db } from "@/db/drizzle";
import { brands, dealerships, users } from "@/db/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BrandDetailsPageProps {
  params: {
    id: string;
  };
}

// Helper: formata role em português
const formatRole = (role: string): string => {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    brand_admin: "Admin da Marca",
    dealership_admin: "Admin da Unidade",
    user: "Usuário",
  };
  return map[role] || role;
};

// Helper: cor do badge baseado no role
const getRoleVariant = (role: string): "default" | "secondary" | "outline" => {
  if (role === "super_admin") return "default";
  if (role === "brand_admin") return "secondary";
  return "outline";
};

export default async function BrandDetailsPage({ params }: BrandDetailsPageProps) {
  // 🔍 Busca a marca
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, params.id))
    .limit(1);

  if (!brand) {
    notFound();
  }

  // 🏢 Busca unidades dessa marca
  const brandDealerships = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.brandId, brand.id));

  // 👥 Busca usuários dessa marca
  const brandUsers = await db
    .select()
    .from(users)
    .where(eq(users.brandId, brand.id));

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      {/* Voltar */}
      <Link
        href="/admin/brands"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar para marcas
      </Link>

      {/* Header da Marca */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            className="size-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm"
            style={{ backgroundColor: brand.primaryColor || "#3B82F6" }}
          >
            {brand.name.charAt(0)}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {brand.name}
              </h1>
              <Badge variant={brand.active ? "default" : "secondary"}>
                {brand.active ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              <span className="font-mono">{brand.slug}</span>
              <span className="mx-2">•</span>
              <CalendarIcon className="inline size-3 mr-1" />
              Criada em {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            ✏️ Editar
          </Button>
          <Button variant="outline" size="sm" disabled>
            {brand.active ? "🔒 Desativar" : "✅ Ativar"}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <StoreIcon className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {brandDealerships.length}
              </p>
              <p className="text-sm text-slate-500">Unidades</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-md">
              <UsersIcon className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {brandUsers.length}
              </p>
              <p className="text-sm text-slate-500">Usuários</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-md">
              <ImageIcon className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                0
              </p>
              <p className="text-sm text-slate-500">Assets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cores da Marca */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          🎨 Cores da Marca
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
            <div
              className="size-10 rounded-md shadow-sm border border-slate-200"
              style={{ backgroundColor: brand.primaryColor || "#3B82F6" }}
            />
            <div>
              <p className="text-xs text-slate-500">Primária</p>
              <p className="text-sm font-mono">{brand.primaryColor || "#3B82F6"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
            <div
              className="size-10 rounded-md shadow-sm border border-slate-200"
              style={{ backgroundColor: brand.secondaryColor || "#1E293B" }}
            />
            <div>
              <p className="text-xs text-slate-500">Secundária</p>
              <p className="text-sm font-mono">{brand.secondaryColor || "#1E293B"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unidades */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <StoreIcon className="size-5" />
          Unidades ({brandDealerships.length})
        </h2>

        {brandDealerships.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-8 text-center">
            <Building2Icon className="size-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">
              Nenhuma unidade cadastrada ainda
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {brandDealerships.map((dealership) => (
              <div
                key={dealership.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {dealership.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPinIcon className="size-3" />
                    {dealership.city && dealership.state
                      ? `${dealership.city}, ${dealership.state}`
                      : "Local não informado"}
                  </p>
                </div>
                <Badge variant={dealership.active ? "default" : "secondary"}>
                  {dealership.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usuários */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <UsersIcon className="size-5" />
          Usuários ({brandUsers.length})
        </h2>

        {brandUsers.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-8 text-center">
            <UsersIcon className="size-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">
              Nenhum usuário associado ainda
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {brandUsers.map((user) => (
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
                <Badge variant={getRoleVariant(user.role)}>
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