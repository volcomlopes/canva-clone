import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Smartphone, FileText, Maximize2 } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ColorPicker } from "@/features/editor/components/color-picker";

import { CanvasSizeModal } from "@/app/(dashboard)/canvas-size-modal";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

// Presets rapidos populares (atalhos)
const QUICK_PRESETS = [
  { id: "ig-post", name: "Post", icon: ImageIcon, width: 1080, height: 1080 },
  { id: "ig-story", name: "Story", icon: Smartphone, width: 1080, height: 1920 },
  { id: "a4", name: "A4", icon: FileText, width: 2480, height: 3508 },
];

export const SettingsSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: SettingsSidebarProps) => {
  const workspace = editor?.getWorkspace();

  const initialWidth = useMemo(() => `${workspace?.width ?? 0}`, [workspace]);
  const initialHeight = useMemo(() => `${workspace?.height ?? 0}`, [workspace]);
  const initialBackground = useMemo(() => workspace?.fill ?? "#ffffff", [workspace]);

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [background, setBackground] = useState(initialBackground);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setWidth(initialWidth);
    setHeight(initialHeight);
    setBackground(initialBackground);
  }, [initialWidth, initialHeight, initialBackground]);

  const changeWidth = (value: string) => setWidth(value);
  const changeHeight = (value: string) => setHeight(value);
  const changeBackground = (value: string) => {
    setBackground(value);
    editor?.changeBackground(value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    editor?.changeSize({
      width: parseInt(width, 10),
      height: parseInt(height, 10),
    });
  };

  const applyPreset = (newW: number, newH: number) => {
    const currentW = workspace?.width || 0;
    const currentH = workspace?.height || 0;

    // Se ja esta no tamanho, ignora
    if (currentW === newW && currentH === newH) return;

    // Detecta shrink "perigoso" (< 80%)
    const ratioW = newW / currentW;
    const ratioH = newH / currentH;
    const isShrink = currentW > 0 && currentH > 0 && (ratioW < 0.8 || ratioH < 0.8);

    if (isShrink) {
      const ok = window.confirm(
        `O novo tamanho (${newW}x${newH}) e bem menor que o atual (${currentW}x${currentH}).\n\n` +
        `Alguns elementos podem ficar fora do canvas e voce vai precisar reposiciona-los.\n\n` +
        `Continuar?`
      );
      if (!ok) return;
    }

    editor?.changeSize({ width: newW, height: newH });
  };

  const handleModalSelect = (newW: number, newH: number) => {
    editor?.changeSize({ width: newW, height: newH });
    setModalOpen(false);
  };

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <>
      <CanvasSizeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSelect={handleModalSelect}
        isCreating={false}
        mode="resize"
        currentWidth={workspace?.width}
        currentHeight={workspace?.height}
      />

      <aside
        className={cn(
          "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
          activeTool === "settings" ? "visible" : "hidden",
        )}
      >
        <ToolSidebarHeader
          title="Configuracoes"
          description="Personalize seu workspace"
        />
        <ScrollArea>
          <div className="p-4 space-y-6">

            {/* Tamanho atual (inputs) */}
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tamanho atual</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500">Largura</Label>
                    <Input
                      placeholder="Width"
                      value={width}
                      type="number"
                      onChange={(e) => changeWidth(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500">Altura</Label>
                    <Input
                      placeholder="Height"
                      value={height}
                      type="number"
                      onChange={(e) => changeHeight(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" variant="outline">
                Aplicar
              </Button>
            </form>

            {/* Presets rapidos */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Presets rapidos</Label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isActive =
                    workspace?.width === preset.width &&
                    workspace?.height === preset.height;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.width, preset.height)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-colors",
                        isActive
                          ? "bg-blue-50 border-blue-500"
                          : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Icon className={cn(
                        "size-5 mx-auto mb-1",
                        isActive ? "text-blue-600" : "text-slate-600"
                      )} />
                      <p className={cn(
                        "text-xs font-medium",
                        isActive ? "text-blue-700" : "text-slate-700"
                      )}>
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {preset.width}x{preset.height}
                      </p>
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => setModalOpen(true)}
              >
                <Maximize2 className="size-4 mr-2" />
                Ver todos os tamanhos
              </Button>
            </div>

            {/* Cor de fundo */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <Label className="text-sm font-medium">Cor de fundo</Label>
              <ColorPicker
                value={background as string}
                onChange={changeBackground}
              />
            </div>
          </div>
        </ScrollArea>
        <ToolSidebarClose onClick={onClose} />
      </aside>
    </>
  );
};