"use client";

import { useTransition } from "react";
import { Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { deleteAsset } from "@/app/(brand)/_actions/delete-asset";

interface AssetCardProps {
  id: string;
  url: string;
  fileName: string | null;
}

export function AssetCard({ id, url, fileName }: AssetCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Deletar "${fileName || "este asset"}"? Essa acao nao pode ser desfeita.`
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteAsset(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Asset deletado");
    });
  };

  return (
    <div className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:shadow-md transition-shadow">
      <img
        src={url}
        alt={fileName || ""}
        className="w-full h-full object-cover"
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