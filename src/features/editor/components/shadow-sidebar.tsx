import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

import { ActiveTool, Editor, ShadowOptions, SHADOW_PRESETS } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface ShadowSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

interface Preset {
  id: string;
  label: string;
  preview: ShadowOptions | null;
}

const PRESETS: Preset[] = [
  { id: "none", label: "Sem sombra", preview: null },
  { id: "soft", label: "Suave", preview: SHADOW_PRESETS.soft },
  { id: "medium", label: "Media", preview: SHADOW_PRESETS.medium },
  { id: "strong", label: "Forte", preview: SHADOW_PRESETS.strong },
  { id: "glow", label: "Glow", preview: SHADOW_PRESETS.glow },
];

const DEFAULT_CUSTOM: ShadowOptions = {
  color: "rgba(0,0,0,0.4)",
  blur: 10,
  offsetX: 0,
  offsetY: 4,
};

export const ShadowSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ShadowSidebarProps) => {
  const [shadow, setShadow] = useState<ShadowOptions>(DEFAULT_CUSTOM);
  const [colorHex, setColorHex] = useState("#000000");
  const [opacityValue, setOpacityValue] = useState(40);

  // Carrega a sombra atual do elemento selecionado
  useEffect(() => {
    if (activeTool !== "shadow") return;
    const current = editor?.getActiveShadow();
    if (current) {
      setShadow(current);
      // Extrai hex e opacity da cor rgba
      const match = current.color.match(/rgba?\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(",").map(function (p) { return p.trim(); });
        const r = parseInt(parts[0], 10);
        const g = parseInt(parts[1], 10);
        const b = parseInt(parts[2], 10);
        const a = parts[3] ? parseFloat(parts[3]) : 1;
        const hex =
          "#" +
          r.toString(16).padStart(2, "0") +
          g.toString(16).padStart(2, "0") +
          b.toString(16).padStart(2, "0");
        setColorHex(hex);
        setOpacityValue(Math.round(a * 100));
      }
    } else {
      setShadow(DEFAULT_CUSTOM);
      setColorHex("#000000");
      setOpacityValue(40);
    }
  }, [editor, activeTool]);

  const onClose = () => onChangeActiveTool("select");

  const applyPreset = (preset: Preset) => {
    editor?.changeShadow(preset.preview);
    if (preset.preview) setShadow(preset.preview);
  };

  const hexToRgba = (hex: string, opacity: number): string => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity / 100})`;
  };

  const updateCustom = (field: keyof ShadowOptions, value: any) => {
    const newShadow = { ...shadow, [field]: value };
    setShadow(newShadow);
    editor?.changeShadow(newShadow);
  };

  const onColorChange = (hex: string) => {
    setColorHex(hex);
    const newShadow = { ...shadow, color: hexToRgba(hex, opacityValue) };
    setShadow(newShadow);
    editor?.changeShadow(newShadow);
  };

  const onOpacityChange = (val: number) => {
    setOpacityValue(val);
    const newShadow = { ...shadow, color: hexToRgba(colorHex, val) };
    setShadow(newShadow);
    editor?.changeShadow(newShadow);
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "shadow" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Sombra"
        description="Aplique uma sombra no elemento"
      />

      <ScrollArea>
        <div className="p-4 space-y-6">
          {/* Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Estilos rapidos
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div
                    className="size-10 bg-white border border-slate-200 rounded"
                    style={{
                      boxShadow: preset.preview
                        ? `${preset.preview.offsetX}px ${preset.preview.offsetY}px ${preset.preview.blur}px ${preset.preview.color}`
                        : "none",
                    }}
                  />
                  <span className="text-xs text-slate-700">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Avancado */}
          <div className="border-t border-slate-200 pt-4">
            <Label className="text-sm font-medium mb-3 block">
              Personalizar
            </Label>

            <div className="space-y-4">
              {/* Cor */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Cor</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="size-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-600 uppercase">
                    {colorHex}
                  </span>
                </div>
              </div>

              {/* Opacidade */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-slate-600">Opacidade</Label>
                  <span className="text-xs text-slate-500">{opacityValue}%</span>
                </div>
                <Slider
                  value={[opacityValue]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(values) => onOpacityChange(values[0])}
                />
              </div>

              {/* Desfoque */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-slate-600">Desfoque</Label>
                  <span className="text-xs text-slate-500">{shadow.blur}px</span>
                </div>
                <Slider
                  value={[shadow.blur]}
                  min={0}
                  max={50}
                  step={1}
                  onValueChange={(values) => updateCustom("blur", values[0])}
                />
              </div>

              {/* Distancia horizontal */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-slate-600">Horizontal</Label>
                  <span className="text-xs text-slate-500">{shadow.offsetX}px</span>
                </div>
                <Slider
                  value={[shadow.offsetX]}
                  min={-50}
                  max={50}
                  step={1}
                  onValueChange={(values) => updateCustom("offsetX", values[0])}
                />
              </div>

              {/* Distancia vertical */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-slate-600">Vertical</Label>
                  <span className="text-xs text-slate-500">{shadow.offsetY}px</span>
                </div>
                <Slider
                  value={[shadow.offsetY]}
                  min={-50}
                  max={50}
                  step={1}
                  onValueChange={(values) => updateCustom("offsetY", values[0])}
                />
              </div>
            </div>
          </div>

          {/* Remover sombra */}
          <div className="border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700"
              onClick={() => editor?.changeShadow(null)}
            >
              <Trash2 className="size-4 mr-2" />
              Remover sombra
            </Button>
          </div>
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};