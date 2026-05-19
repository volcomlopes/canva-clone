import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { DealershipForm } from "../../../_components/dealership-form";

export default function NewDealershipPage() {
  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      <Link
        href="/brand/dealerships"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar para unidades
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Nova Unidade
        </h2>
        <p className="text-slate-500 text-sm">
          Adicione uma nova concessionária ou unidade da sua marca.
        </p>
      </div>

      <DealershipForm />
    </div>
  );
}