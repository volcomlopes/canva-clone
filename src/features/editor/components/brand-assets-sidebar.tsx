import { AlertTriangle, Loader, Building2, FolderIcon } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { useGetBrandAssets } from "@/features/brand-assets/api/use-get-brand-assets";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BrandAssetsSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  produtos: "Produtos / Servicos",
  logos: "Logos",
  backgrounds: "Backgrounds",
  icones: "Icones",
  banners: "Banners promocionais",
};

const CATEGORY_ORDER = ["produtos", "logos", "backgrounds", "icones", "banners"];

export const BrandAssetsSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: BrandAssetsSidebarProps) => {
  const { data, isLoading, isError } = useGetBrandAssets();

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // Agrupa por categoria
  const grouped = new Map<string, typeof data>();
  if (data) {
    data.forEach((asset) => {
      const cat = asset.category || "sem-categoria";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(asset);
    });
  }

  // Ordena as categorias na ordem padrao
  const sortedCategories = Array.from(grouped.keys()).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "brand-assets" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Marca"
        description="Fotos oficiais da marca aprovadas para uso"
      />

      {isLoading && (
        <div className="flex items-center justify-center flex-1">
          <Loader className="size-4 text-muted-foreground animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col gap-y-4 items-center justify-center flex-1">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">
            Erro ao carregar assets
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <div className="flex flex-col gap-y-3 items-center justify-center flex-1 px-6 text-center">
          <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Building2 className="size-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Nenhum asset disponivel
          </p>
          <p className="text-xs text-slate-500">
            O admin da sua marca ainda nao subiu fotos oficiais.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ScrollArea>
          <div className="p-4 space-y-6">
            {sortedCategories.map((category) => {
              const assets = grouped.get(category) || [];
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderIcon className="size-3.5 text-slate-500" />
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {CATEGORY_LABELS[category] || category}
                    </h4>
                    <span className="text-xs text-slate-400">
                      ({assets.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => editor?.addImage(asset.url)}
                        className="relative w-full h-[100px] group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border"
                        title={asset.fileName || ""}
                      >
                        <img
                          src={asset.url}
                          alt={asset.fileName || "Asset"}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};