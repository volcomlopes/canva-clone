import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { dealerships } from "@/db/schema";

import { DealershipForm } from "../../../../_components/dealership-form";

interface EditDealershipPageProps {
  params: {
    id: string;
  };
}

export default async function EditDealershipPage({
  params,
}: EditDealershipPageProps) {
  const session = await auth();
  const brandId = session?.user?.brandId;

  // 🛡️ Busca SÓ se for da marca do user
  const [dealership] = await db
    .select()
    .from(dealerships)
    .where(
      and(
        eq(dealerships.id, params.id),
        eq(dealerships.brandId, brandId!)
      )
    )
    .limit(1);

  if (!dealership) {
    notFound();
  }

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      <Link
        href={`/brand/dealerships/${dealership.id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar para {dealership.name}
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Editar Unidade
        </h2>
        <p className="text-slate-500 text-sm">
          Atualize os dados da unidade {dealership.name}.
        </p>
      </div>

      <DealershipForm dealership={dealership} />
    </div>
  );
}