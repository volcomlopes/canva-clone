import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";

import { db } from "@/db/drizzle";
import { brands } from "@/db/schema";

import { BrandForm } from "../../../../_components/brand-form";

interface EditBrandPageProps {
  params: {
    id: string;
  };
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, params.id))
    .limit(1);

  if (!brand) {
    notFound();
  }

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      <Link
        href={`/admin/brands/${brand.id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar para {brand.name}
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Editar Marca
        </h2>
        <p className="text-slate-500 text-sm">
          Atualize os dados da marca {brand.name}.
        </p>
      </div>

      <BrandForm brand={brand} />
    </div>
  );
}