import { AlertTriangle, Loader, Building2, FolderIcon, ImageIcon } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { useGetBrandAssets } from "@/features/brand-assets/api/use-get-brand-assets";
import { useGetBrandKit } from "@/features/brand-kit/api/use-get-brand-kit";

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

const LOGO_SLOTS = [
  { key: "logoPrimary", label: "Principal", background: "light" },
  { key: "logoHorizontal", label: "Horizontal", background: "light" },
  { key: "logoVertical", label: "Vertical", background: "light" },
  { key: "logoMonoWhite", label: "Mono Branco", background: "dark" },
  { key: "logoMonoBlack", label: "Mono Preto", background: "light" },
  { key: "favicon", label: "Favicon", background: "transparent" },
] as const;

const TRANSPARENT_BG = `
  linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
  linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
  linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
`;

export const BrandAssetsSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: BrandAssetsSidebarProps) => {
  const { data: assets, isLoading: assetsLoading, isError } = useGetBrandAssets();
  const { data: kit, isLoading: kitLoading } = useGetBrandKit();

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // Filtra logos que existem
  const availableLogos = kit
    ? LOGO_SLOTS.filter((slot) => kit[slot.key as keyof typeof kit])
    : [];

  // Agrupa assets por categoria
  const grouped = new Map<string, typeof assets>();
  if (assets) {
    assets.forEach((asset) => {
      const cat = asset.category || "sem-categoria";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(asset);
    });
  }

  const sortedCategories = Array.from(grouped.keys()).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const isLoading = assetsLoading || kitLoading;
  const hasNothing =
    !isLoading &&
    !isError &&
    availableLogos.length === 0 &&
    (!assets || assets.length === 0);

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "brand-assets" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Marca"
        description="Logos e fotos oficiais da marca"
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
            Erro ao carregar dados
          </p>
        </div>
      )}

      {hasNothing && (
        <div className="flex flex-col gap-y-3 items-center justify-center flex-1 px-6 text-center">
          <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Building2 className="size-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Nenhum recurso disponivel
          </p>
          <p className="text-xs text-slate-500">
            O admin da sua marca ainda nao subiu logos nem fotos.
          </p>
        </div>
      )}

      {!isLoading && !isError && !hasNothing && (
        <ScrollArea>
          <div className="p-4 space-y-6">
            {/* SECAO LOGOS */}
            {availableLogos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="size-3.5 text-slate-500" />
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Logos
                  </h4>
                  <span className="text-xs text-slate-400">
                    ({availableLogos.length})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {availableLogos.map((slot) => {
                    const url = kit?.[slot.key as keyof typeof kit] as string;
                    const bgStyle: React.CSSProperties =
                      slot.background === "dark"
                        ? { backgroundColor: "#0F172A" }
                        : slot.background === "transparent"
                        ? {
                            backgroundImage: TRANSPARENT_BG,
                            backgroundSize: "12px 12px",
                            backgroundPosition:
                              "0 0, 0 6px, 6px -6px, -6px 0px",
                            backgroundColor: "#FFFFFF",
                          }
                        : { backgroundColor: "#F8FAFC" };

                    return (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => editor?.addImage(url)}
                        className="group relative w-full h-[80px] rounded-md border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex items-center justify-center"
                        style={bgStyle}
                        title={slot.label}
                      >
                        <img
                          src={url}
                          alt={slot.label}
                          className="max-w-full max-h-full object-contain p-1"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                          {slot.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECAO ASSETS / FOTOS */}
            {assets && assets.length > 0 && (
              <>
                {availableLogos.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="size-3.5 text-slate-500" />
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Fotos
                      </h4>
                    </div>
                  </div>
                )}

                {sortedCategories.map((category) => {
                  const categoryAssets = grouped.get(category) || [];
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <FolderIcon className="size-3.5 text-slate-500" />
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                          {CATEGORY_LABELS[category] || category}
                        </h4>
                        <span className="text-xs text-slate-400">
                          ({categoryAssets.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {categoryAssets.map((asset) => (
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
              </>
            )}
          </div>
        </ScrollArea>
      )}

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};