"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

import {
  ActiveTool,
  Editor,
  GradientOptions,
  GradientType,
  DEFAULT_GRADIENT,
  GRADIENT_PRESETS,
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface GradientSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

// Gera CSS gradient pra preview visual
const gradientToCss = (grad: GradientOptions): string => {
  const stops = grad.colorStops
    .map(function (s) { return `${s.color} ${Math.round(s.offset * 100)}%`; })
    .join(", ");

  if (grad.type === "linear") {
    // CSS angle: 0deg = vai pra cima, Fabric: 0deg = vai pra direita
    // Ajustar: CSS angle = Fabric angle - 90 (porque CSS comeca em cima)
    const cssAngle = grad.angle + 90;
    return `linear-gradient(${cssAngle}deg, ${stops})`;
  }
  return `radial-gradient(circle, ${stops})`;
};

const PRESETS_LIST = [
  { id: "sunset", label: "Por do sol", grad: GRADIENT_PRESETS.sunset },
  { id: "ocean", label: "Oceano", grad: GRADIENT_PRESETS.ocean },
  { id: "forest", label: "Floresta", grad: GRADIENT_PRESETS.forest },
  { id: "purple", label: "Roxo", grad: GRADIENT_PRESETS.purple },
  { id: "dark", label: "Escuro", grad: GRADIENT_PRESETS.dark },
  { id: "fire", label: "Fogo", grad: GRADIENT_PRESETS.fire },
];

export const GradientSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: GradientSidebarProps) => {
  const [gradient, setGradient] = useState<GradientOptions>(DEFAULT_GRADIENT);

  // Carrega gradient do elemento ativo quando abre a sidebar
  useEffect(() => {
    if (activeTool !== "gradient") return;

    const current = editor?.getActiveFillGradient();
    if (current && current.colorStops.length >= 2) {
      setGradient(current);
    } else {
      setGradient(DEFAULT_GRADIENT);
    }
  }, [editor, activeTool]);

  const apply = (newGrad: GradientOptions) => {
    setGradient(newGrad);
    editor?.changeFillGradient(newGrad);
  };

  const applyPreset = (preset: GradientOptions) => {
    apply(preset);
  };

  const changeType = (type: GradientType) => {
    apply({ ...gradient, type });
  };

  const changeAngle = (angle: number) => {
    apply({ ...gradient, angle });
  };

  const changeColor = (index: number, newColor: string) => {
    const newStops = gradient.colorStops.map(function (s, i) {
      if (i === index) {
        return { ...s, color: newColor };
      }
      return s;
    });
    apply({ ...gradient, colorStops: newStops });
  };

  const removeGradient = () => {
    editor?.changeFillGradient(null);
  };

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // Pega as 2 primeiras cores pra editar (na sessao 3 vamos liberar mais)
  const color1 = gradient.colorStops[0]?.color || "#3b82f6";
  const color2 = gradient.colorStops[gradient.colorStops.length - 1]?.color || "#a855f7";

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "gradient" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Gradiente"
        description="Aplique um gradiente no preenchimento"
      />

      <ScrollArea>
        <div className="p-4 space-y-6">

          {/* Preview do gradient atual */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Preview</Label>
            <div
              className="w-full h-24 rounded-lg border border-slate-200"
              style={{ background: gradientToCss(gradient) }}
            />
          </div>

          {/* Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Estilos rapidos
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS_LIST.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.grad)}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div
                    className="w-full h-12 rounded"
                    style={{ background: gradientToCss(preset.grad) }}
                  />
                  <span className="text-xs text-slate-700">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div className="border-t border-slate-200 pt-4">
            <Label className="text-sm font-medium mb-3 block">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => changeType("linear")}
                className={cn(
                  "py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                  gradient.type === "linear"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                Linear
              </button>
              <button
                type="button"
                onClick={() => changeType("radial")}
                className={cn(
                  "py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                  gradient.type === "radial"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                Radial
              </button>
            </div>
          </div>

          {/* Angulo (so pra linear) */}
          {gradient.type === "linear" && (
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm font-medium">Angulo</Label>
                <span className="text-xs text-slate-500">{Math.round(gradient.angle)}°</span>
              </div>
              <Slider
                value={[gradient.angle]}
                min={0}
                max={360}
                step={15}
                onValueChange={(values) => changeAngle(values[0])}
              />
              <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
                <span>270°</span>
                <span>360°</span>
              </div>
            </div>
          )}

          {/* Cores */}
          <div className="border-t border-slate-200 pt-4">
            <Label className="text-sm font-medium mb-3 block">Cores</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => changeColor(0, e.target.value)}
                  className="size-10 rounded border border-slate-200 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Cor inicial</p>
                  <p className="text-xs font-mono uppercase text-slate-700">
                    {color1}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color2}
                  onChange={(e) => changeColor(gradient.colorStops.length - 1, e.target.value)}
                  className="size-10 rounded border border-slate-200 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Cor final</p>
                  <p className="text-xs font-mono uppercase text-slate-700">
                    {color2}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Em breve: adicionar mais cores intermediarias
            </p>
          </div>

          {/* Remover */}
          <div className="border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700"
              onClick={removeGradient}
            >
              <Trash2 className="size-4 mr-2" />
              Remover gradiente
            </Button>
          </div>
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};