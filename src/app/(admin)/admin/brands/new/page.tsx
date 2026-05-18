import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { BrandForm } from "../../../_components/brand-form";

export default function NewBrandPage() {
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

      {/* Cabeçalho */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Nova Marca
        </h2>
        <p className="text-slate-500 text-sm">
          Adicione uma nova marca-cliente à plataforma Artbase.
        </p>
      </div>

      {/* Formulário */}
      <BrandForm />
    </div>
  );
}