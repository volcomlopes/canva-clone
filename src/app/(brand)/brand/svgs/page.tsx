import { eq, desc } from "drizzle-orm";
import { Shapes } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { brandSvgs } from "@/db/schema";

import { SvgsUploader } from "@/app/(brand)/_components/svgs-uploader";
import { SvgCard } from "@/app/(brand)/_components/svg-card";

export default async function BrandSvgsPage() {
  const session = await auth();
  const brandId = session?.user?.brandId;

  const svgs = await db
    .select()
    .from(brandSvgs)
    .where(eq(brandSvgs.brandId, brandId!))
    .orderBy(desc(brandSvgs.createdAt));

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Vetores da marca
        </h2>
        <p className="text-slate-500 text-sm">
          Icones e vetores SVG oficiais, recoloriveis pelos vendedores no editor.
        </p>
      </div>

      <SvgsUploader />

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-md">
            <Shapes className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{svgs.length}</p>
            <p className="text-sm text-slate-500">Total de vetores</p>
          </div>
        </div>
      </div>

      {svgs.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-16 text-center">
          <div className="size-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Shapes className="size-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nenhum vetor ainda
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Use o dropzone acima para subir os vetores SVG do brandbook. Eles
            aparecerao na aba Vetores do editor para todos os vendedores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {svgs.map((svg) => (
            <SvgCard
              key={svg.id}
              id={svg.id}
              url={svg.url}
              fileName={svg.fileName}
            />
          ))}
        </div>
      )}
    </div>
  );
}