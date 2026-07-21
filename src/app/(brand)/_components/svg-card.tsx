"use client";

import { useTransition } from "react";
import { Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { deleteBrandSvg } from "@/app/(brand)/_actions/delete-brand-svg";

interface SvgCardProps {
  id: string;
  url: string;
  fileName: string | null;
}

const TRANSPARENT_BG = `
  linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
  linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
  linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
`;

export function SvgCard({ id, url, fileName }: SvgCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Deletar "${fileName || "este vetor"}"? Essa acao nao pode ser desfeita.`
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteBrandSvg({ id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Vetor deletado");
    });
  };

  return (
    <div
      className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-center"
      style={{
        backgroundImage: TRANSPARENT_BG,
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <img
        src={url}
        alt={fileName || ""}
        className="max-w-full max-h-full object-contain p-3"
      />

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="absolute top-2 right-2 size-8 rounded-md flex items-center justify-center text-white shadow-md bg-black/60 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
        title="Deletar"
      >
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <Trash2Icon className="size-4" />
        )}
      </button>

      {fileName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-white truncate" title={fileName}>
            {fileName}
          </p>
        </div>
      )}
    </div>
  );
}