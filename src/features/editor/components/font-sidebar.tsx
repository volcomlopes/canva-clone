"use client";

import {
  ActiveTool,
  Editor,
  fonts,
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { useGetBrandKit } from "@/features/brand-kit/api/use-get-brand-kit";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface FontSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

const BRAND_SLOTS = [
  { key: "fontHeading", label: "Titulo" },
  { key: "fontSubheading", label: "Subtitulo" },
  { key: "fontBody", label: "Corpo" },
  { key: "fontHighlight", label: "Destaque" },
];

export const FontSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: FontSidebarProps) => {
  const value = editor?.getActiveFontFamily();
  const { data: kit } = useGetBrandKit();

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // Filtra slots da marca que tem fonte configurada
  const brandFonts = kit
    ? BRAND_SLOTS.filter(function (slot) {
        return kit[slot.key as keyof typeof kit];
      })
    : [];

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "font" ? "visible" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Fonte"
        description="Altere a fonte do texto"
      />
      <ScrollArea>
        {/* Fontes da Marca */}
        {brandFonts.length > 0 && (
          <div className="p-4 border-b">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Fontes da Marca
            </h4>
            <div className="space-y-1">
              {brandFonts.map(function (slot) {
                const fontName = kit?.[slot.key as keyof typeof kit] as string;
                return (
                  <Button
                    key={slot.key}
                    variant="secondary"
                    size="lg"
                    className={cn(
                      "w-full h-16 justify-start text-left relative",
                      value === fontName && "border-2 border-blue-500"
                    )}
                    style={{
                      fontFamily: `"${fontName}", sans-serif`,
                      fontSize: "18px",
                      padding: "8px 16px",
                    }}
                    onClick={() => editor?.changeFontFamily(fontName)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                        {slot.label}
                      </span>
                      <span>{fontName}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fontes Padrao */}
        <div className="p-4 space-y-1 border-b">
          {brandFonts.length > 0 && (
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Outras Fontes
            </h4>
          )}
          {fonts.map(function (font) {
            return (
              <Button
                key={font}
                variant="secondary"
                size="lg"
                className={cn(
                  "w-full h-16 justify-start text-left",
                  value === font && "border-2 border-blue-500"
                )}
                style={{
                  fontFamily: font,
                  fontSize: "16px",
                  padding: "8px 16px",
                }}
                onClick={() => editor?.changeFontFamily(font)}
              >
                {font}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};