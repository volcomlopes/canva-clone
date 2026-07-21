"use client";

import { useState } from "react";
import { AlertTriangle, Loader, Shapes, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { useGetBrandSvgs } from "@/features/brand-svgs/api/use-get-brand-svgs";
import { createBrandSvgs } from "@/app/(brand)/_actions/create-brand-svgs";
import { deleteBrandSvg } from "@/app/(brand)/_actions/delete-brand-svg";

import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BrandSvgsSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const BrandSvgsSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: BrandSvgsSidebarProps) => {
  const session = useSession();
  const queryClient = useQueryClient();
  const { data: svgs, isLoading, isError } = useGetBrandSvgs();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isBrandAdmin = session.data?.user?.role === "brand_admin";

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    fileName: string | null
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Deletar "${fileName || "este vetor"}"? Essa acao nao pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    const result = await deleteBrandSvg({ id });
    setDeletingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["brand-svgs"] });
    toast.success("Vetor deletado");
  };

  const hasNothing = !isLoading && !isError && (!svgs || svgs.length === 0);

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "brand-svgs" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Vetores"
        description="Icones e vetores oficiais da marca"
      />

      {/* Upload - so para brand_admin */}
      {isBrandAdmin && (
        <div className="p-4 border-b">
          <UploadButton
            appearance={{
              button: "w-full text-sm font-medium bg-blue-600",
              allowedContent: "hidden",
            }}
            content={{
              button: "Subir vetor SVG",
            }}
            endpoint="brandSvgsUploader"
            onClientUploadComplete={async (res) => {
              if (!res || res.length === 0) {
                toast.error("Nenhum arquivo retornado");
                return;
              }

              toast.loading("Salvando vetores...", { id: "saving-svgs" });

              const result = await createBrandSvgs({
                svgs: res.map((file) => ({
                  url: file.url,
                  fileName: file.name,
                  fileSize: file.size,
                })),
              });

              toast.dismiss("saving-svgs");

              if (result.error) {
                toast.error(result.error);
                return;
              }

              queryClient.invalidateQueries({ queryKey: ["brand-svgs"] });

              toast.success(
                `${result.count} ${
                  result.count === 1 ? "vetor salvo" : "vetores salvos"
                }!`
              );
            }}
            onUploadError={(error) => {
              const msg = error.message || "";
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
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center flex-1">
          <Loader className="size-4 text-muted-foreground animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col gap-y-4 items-center justify-center flex-1">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">
            Erro ao carregar vetores
          </p>
        </div>
      )}

      {hasNothing && (
        <div className="flex flex-col gap-y-3 items-center justify-center flex-1 px-6 text-center">
          <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Shapes className="size-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Nenhum vetor disponivel
          </p>
          <p className="text-xs text-slate-500">
            {isBrandAdmin
              ? "Suba os vetores SVG do brandbook usando o botao acima."
              : "O admin da sua marca ainda nao subiu vetores SVG."}
          </p>
        </div>
      )}

      {!isLoading && !isError && !hasNothing && (
        <ScrollArea>
          <div className="p-4">
            <p className="text-[11px] text-slate-400 mb-3">
              Clique para adicionar. Depois use o botao de cor para recolorir.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {svgs &&
                svgs.map((svg) => (
                  <div
                    key={svg.id}
                    className="relative group w-full h-[80px] hover:border-blue-400 hover:shadow-md transition-all bg-white rounded-md overflow-hidden border border-slate-200"
                  >
                    <button
                      onClick={() => editor?.addSvg(svg.url)}
                      className="w-full h-full flex items-center justify-center p-2"
                      title={svg.fileName || "Vetor"}
                    >
                      <img
                        src={svg.url}
                        alt={svg.fileName || "Vetor"}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                      />
                    </button>

                    {isBrandAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, svg.id, svg.fileName)}
                        disabled={deletingId === svg.id}
                        className="absolute top-1 right-1 size-6 rounded-md flex items-center justify-center text-white shadow-md bg-black/60 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                        title="Deletar"
                      >
                        {deletingId === svg.id ? (
                          <Loader className="size-3 animate-spin" />
                        ) : (
                          <X className="size-3" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </ScrollArea>
      )}

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};