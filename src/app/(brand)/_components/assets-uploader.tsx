"use client";

import { useState } from "react";
import { UploadIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { UploadDropzone } from "@/lib/uploadthing";
import { createAssets } from "@/app/(brand)/_actions/create-assets";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "produtos", label: "Produtos / Servicos" },
  { value: "logos", label: "Logos" },
  { value: "backgrounds", label: "Backgrounds" },
  { value: "icones", label: "Icones" },
  { value: "banners", label: "Banners promocionais" },
];

export function AssetsUploader() {
  const [category, setCategory] = useState<string>("produtos");
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <UploadIcon className="size-5 text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">
          Subir assets
        </h2>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Categoria
        </label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-1.5">
          Todos os arquivos deste lote serao salvos nesta categoria
        </p>
      </div>

      <UploadDropzone
        endpoint="brandAssetsUploader"
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
          label: "Arraste fotos aqui ou clique para selecionar",
          allowedContent: "Ate 20 imagens por vez (max 8MB cada)",
          button({ ready, isUploading }) {
            if (isUploading) return "Enviando...";
            if (ready) return "Selecionar fotos";
            return "Carregando...";
          },
        }}
        onClientUploadComplete={async (res) => {
          if (!res || res.length === 0) {
            toast.error("Nenhum arquivo retornado");
            return;
          }

          setIsSaving(true);
          toast.loading("Salvando assets...", { id: "saving-assets" });

          const result = await createAssets({
            assets: res.map((file) => ({
              url: file.url,
              fileName: file.name,
              fileSize: file.size,
              category,
            })),
          });

          setIsSaving(false);
          toast.dismiss("saving-assets");

          if (result.error) {
            toast.error(result.error);
            return;
          }

          toast.success(
            `${result.count} ${
              result.count === 1 ? "asset salvo" : "assets salvos"
            } com sucesso!`
          );
        }}
        onUploadError={(error) => {
          const msg = error.message || "";

          if (msg.includes("FileSizeMismatch") || msg.includes("FileSize")) {
            toast.error("Arquivo muito grande. O limite e 8MB por foto.");
            return;
          }

          if (msg.includes("FileCountMismatch") || msg.includes("FileCount")) {
            toast.error("Muitos arquivos. O limite e 20 fotos por upload.");
            return;
          }

          if (msg.includes("InvalidFileType") || msg.includes("FileType")) {
            toast.error("Tipo de arquivo invalido. Use apenas imagens (JPG, PNG, WebP).");
            return;
          }

          if (msg.includes("Unauthorized") || msg.includes("Apenas admins")) {
            toast.error("Voce nao tem permissao para subir assets.");
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