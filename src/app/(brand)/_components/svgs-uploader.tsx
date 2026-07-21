"use client";

import { useState } from "react";
import { UploadIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { UploadDropzone } from "@/lib/uploadthing";
import { createBrandSvgs } from "@/app/(brand)/_actions/create-brand-svgs";

export function SvgsUploader() {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <UploadIcon className="size-5 text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">
          Subir vetores
        </h2>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-slate-600">
          Apenas arquivos SVG. Os vendedores poderao inserir estes vetores no
          editor e recolorir usando as cores da marca.
        </p>
      </div>

      <UploadDropzone
        endpoint="brandSvgsUploader"
        config={{ mode: "auto" }}
        appearance={{
          container:
            "border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors py-8",
          label: "text-sm font-medium text-slate-700",
          allowedContent: "text-xs text-slate-500",
          button:
            "bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md ut-uploading:bg-blue-400 ut-readying:bg-blue-400",
        }}
        content={{
          label: "Arraste vetores SVG aqui ou clique para selecionar",
          allowedContent: "Ate 10 arquivos SVG por vez (max 2MB cada)",
          button({ ready, isUploading }) {
            if (isUploading) return "Enviando...";
            if (ready) return "Selecionar vetores";
            return "Carregando...";
          },
        }}
        onClientUploadComplete={async (res) => {
          if (!res || res.length === 0) {
            toast.error("Nenhum arquivo retornado");
            return;
          }

          setIsSaving(true);
          toast.loading("Salvando vetores...", { id: "saving-svgs" });

          const result = await createBrandSvgs({
            svgs: res.map((file) => ({
              url: file.url,
              fileName: file.name,
              fileSize: file.size,
            })),
          });

          setIsSaving(false);
          toast.dismiss("saving-svgs");

          if (result.error) {
            toast.error(result.error);
            return;
          }

          toast.success(
            `${result.count} ${
              result.count === 1 ? "vetor salvo" : "vetores salvos"
            } com sucesso!`
          );
        }}
        onUploadError={(error) => {
          const msg = error.message || "";

          if (msg.includes("FileSizeMismatch") || msg.includes("FileSize")) {
            toast.error("Arquivo muito grande. O limite e 2MB por vetor.");
            return;
          }

          if (msg.includes("FileCountMismatch") || msg.includes("FileCount")) {
            toast.error("Muitos arquivos. O limite e 10 vetores por upload.");
            return;
          }

          if (msg.includes("InvalidFileType") || msg.includes("FileType")) {
            toast.error("Tipo invalido. Envie apenas arquivos SVG.");
            return;
          }

          if (msg.includes("Unauthorized") || msg.includes("Apenas admins")) {
            toast.error("Voce nao tem permissao para subir vetores.");
            return;
          }

          toast.error(`Erro no upload: ${msg || "tente novamente"}`);
        }}
      />

      {isSaving && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <Loader2Icon className="size-4 animate-spin" />
          Salvando no banco...
        </div>
      )}
    </div>
  );
}