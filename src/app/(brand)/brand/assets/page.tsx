import { eq } from "drizzle-orm";
import {
  ImageIcon,
  UploadIcon,
  FolderIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandAssets } from "@/db/schema";

import { Button } from "@/components/ui/button";

export default async function BrandAssetsPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  // Busca assets da marca
  const assets = await db
    .select()
    .from(brandAssets)
    .where(eq(brandAssets.brandId, brandId!));

  // Conta assets por categoria
  const categoryCount = new Map<string, number>();
  assets.forEach((asset) => {
    const cat = asset.category || "Sem categoria";
    categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
  });

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      {/* Cabecalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Biblioteca de Assets
          </h2>
          <p className="text-slate-500 text-sm">
            Fotos oficiais da marca disponiveis para todos os vendedores.
          </p>
        </div>

        <Button disabled title="Em breve">
          <UploadIcon className="size-4 mr-2" />
          Upload de Fotos
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-md">
              <ImageIcon className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {assets.length}
              </p>
              <p className="text-sm text-slate-500">Total de fotos</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <FolderIcon className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {categoryCount.size}
              </p>
              <p className="text-sm text-slate-500">Categorias</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-md">
              <UploadIcon className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                0 MB
              </p>
              <p className="text-sm text-slate-500">Armazenamento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado Vazio ou Listagem */}
      {assets.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-16 text-center">
          <div className="size-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <ImageIcon className="size-10 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Sua biblioteca esta vazia
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Faca upload das fotos oficiais da marca (modelos, logos, backgrounds) para que seus vendedores possam usar nos materiais.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6 text-left">
            <p className="text-sm font-medium text-slate-900 mb-2">
              Sugestoes do que subir:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
              <li>Fotos dos modelos (Haval H6, Ora 3, etc.)</li>
              <li>Logos da marca em diferentes cores</li>
              <li>Backgrounds e texturas oficiais</li>
              <li>Imagens de campanha</li>
            </ul>
          </div>

          <Button disabled title="Em breve">
            <UploadIcon className="size-4 mr-2" />
            Fazer Upload (em breve)
          </Button>
        </div>
      ) : (
        <div>
          {/* Categorias */}
          {Array.from(categoryCount.entries()).map(([category, count]) => (
            <div key={category} className="mb-8">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <FolderIcon className="size-4" />
                {category} ({count})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {assets
                  .filter((a) => (a.category || "Sem categoria") === category)
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={asset.url}
                        alt={asset.fileName || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info bottom */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          💡 <strong>Proximo passo:</strong> sistema de upload em massa (ate 20 fotos por vez), organizacao por categorias, e integracao com a aba Imagens do editor.
        </p>
      </div>
    </div>
  );
}