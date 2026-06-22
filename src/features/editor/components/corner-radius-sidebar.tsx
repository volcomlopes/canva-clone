import { useState, useEffect } from "react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface CornerRadiusSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

const PRESETS = [
  { label: "Reto", value: 0 },
  { label: "Suave", value: 12 },
  { label: "Medio", value: 30 },
  { label: "Pill", value: 9999 },
];

export const CornerRadiusSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: CornerRadiusSidebarProps) => {
  const [radius, setRadius] = useState(0);
  const [maxRadius, setMaxRadius] = useState(500);

  useEffect(() => {
    if (activeTool !== "corner-radius") return;

    const obj = editor?.selectedObjects[0];
    if (obj && obj.type === "rect") {
      const w = (obj.width || 0) * (obj.scaleX || 1);
      const h = (obj.height || 0) * (obj.scaleY || 1);
      const max = Math.floor(Math.min(w, h) / 2);
      setMaxRadius(max);
    }

    setRadius(editor?.getActiveFillRadius() ?? 0);
  }, [editor, activeTool]);

  const onClose = () => onChangeActiveTool("select");

  const onChangeRadius = (value: number) => {
    // Garante que nunca passa do max da forma
    const clamped = Math.min(value, maxRadius);
    setRadius(clamped);
    editor?.changeFillRadius(clamped);
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "corner-radius" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Cantos arredondados"
        description="Controle o raio dos cantos do retangulo"
      />

      <ScrollArea>
        <div className="p-4 space-y-6">
          {/* Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Predefinicoes
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChangeRadius(preset.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-lg border transition-colors",
                    radius === Math.min(preset.value, maxRadius)
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div
                    className="size-10 bg-slate-200 border border-slate-300"
                    style={{
                      borderRadius:
                        preset.value >= 9999 ? "9999px" : `${preset.value / 2}px`,
                    }}
                  />
                  <span className="text-xs text-slate-700">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slider */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-slate-600">Raio</Label>
              <span className="text-xs text-slate-500">
                {radius}px / {maxRadius}px
              </span>
            </div>
            <Slider
              value={[radius]}
              min={0}
              max={maxRadius}
              step={1}
              onValueChange={(values) => onChangeRadius(values[0])}
            />
          </div>
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};