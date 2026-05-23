"use client";

import { useTransition } from "react";
import { Trash2Icon, UploadIcon, Loader2Icon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

import { UploadButton } from "@/lib/uploadthing";
import { updateBrandLogo } from "@/app/(brand)/_actions/update-brand-logo";

import { Button } from "@/components/ui/button";

type LogoType =
  | "logoPrimary"
  | "logoMonoWhite"
  | "logoMonoBlack"
  | "logoHorizontal"
  | "logoVertical"
  | "favicon";

interface LogoSlotCardProps {
  logoType: LogoType;
  label: string;
  description: string;
  background: "light" | "dark" | "transparent";
  currentUrl: string | null;
}

// Padrao xadrez tipo Photoshop (para fundo transparente)
const TRANSPARENT_BG = `
  linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
  linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
  linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
`;

export function LogoSlotCard({
  logoType,
  label,
  description,
  background,
  currentUrl,
}: LogoSlotCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!currentUrl) return;

    const confirmed = window.confirm(
      `Remover o logo "${label}"? Voce podera subir outro depois.`
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await updateBrandLogo({ logoType, url: null });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Logo "${label}" removido`);
    });
  };

  // Estilo do preview baseado no background
  const previewStyle: React.CSSProperties =
    background === "dark"
      ? { backgroundColor: "#0F172A" }
      : background === "transparent"
      ? {
          backgroundImage: TRANSPARENT_BG,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          backgroundColor: "#FFFFFF",
        }
      : { backgroundColor: "#F8FAFC" };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Preview do logo */}
      <div
        className="size-24 rounded-md border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={previewStyle}
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={label}
            className="max-w-full max-h-full object-contain p-2"
          />
        ) : (
          <span className="text-xs text-slate-400 text-center px-2">
            Sem logo
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm text-slate-900">{label}</h4>
          {currentUrl && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
              <CheckIcon className="size-3" />
              Configurado
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {/* Acoes */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <UploadButton
          endpoint="brandLogosUploader"
          appearance={{
            button:
              "bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-md ut-uploading:bg-blue-400 ut-readying:bg-blue-400 h-9",
            allowedContent: "hidden",
          }}
          content={{
            button({ ready, isUploading }) {
              if (isUploading) return "Enviando...";
              if (ready) return currentUrl ? "Trocar" : "Subir logo";
              return "...";
            },
          }}
          onClientUploadComplete={(res) => {
            if (!res || res.length === 0) return;

            startTransition(async () => {
              const result = await updateBrandLogo({
                logoType,
                url: res[0].url,
              });

              if (result.error) {
                toast.error(result.error);
                return;
              }

              toast.success(`Logo "${label}" salvo!`);
            });
          }}
          onUploadError={(error) => {
            const msg = error.message || "";
            if (msg.includes("FileSize")) {
              toast.error("Arquivo muito grande. Limite: 4MB.");
              return;
            }
            if (msg.includes("FileType") || msg.includes("InvalidFileType")) {
              toast.error("Tipo invalido. Use PNG, JPG ou SVG.");
              return;
            }
            toast.error(`Erro: ${msg || "tente novamente"}`);
          }}
        />

        {currentUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 h-9"
            title="Remover logo"
          >
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}