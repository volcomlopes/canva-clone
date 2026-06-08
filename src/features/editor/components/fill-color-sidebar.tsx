"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, X, Palette, Droplet } from "lucide-react";

import {
  ActiveTool,
  Editor,
  FILL_COLOR,
  GradientOptions,
  GradientType,
  GradientColorStop,
  DEFAULT_GRADIENT,
  GRADIENT_PRESETS,
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { ColorPicker } from "@/features/editor/components/color-picker";
import { BrandColorsPalette } from "@/features/editor/components/brand-colors-palette";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface FillColorSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

// Stop com ID interno
interface InternalStop extends GradientColorStop {
  uid: string;
}

const makeUid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const gradientToCss = (stops: InternalStop[], type: GradientType, angle: number): string => {
  const sortedStops = [...stops].sort(function (a, b) { return a.offset - b.offset; });
  const stopsStr = sortedStops
    .map(function (s) { return `${s.color} ${Math.round(s.offset * 100)}%`; })
    .join(", ");
  if (type === "linear") {
    const cssAngle = angle + 90;
    return `linear-gradient(${cssAngle}deg, ${stopsStr})`;
  }
  return `radial-gradient(circle, ${stopsStr})`;
};

const PRESETS_LIST = [
  { id: "sunset", label: "Por do sol", grad: GRADIENT_PRESETS.sunset },
  { id: "ocean", label: "Oceano", grad: GRADIENT_PRESETS.ocean },
  { id: "forest", label: "Floresta", grad: GRADIENT_PRESETS.forest },
  { id: "purple", label: "Roxo", grad: GRADIENT_PRESETS.purple },
  { id: "dark", label: "Escuro", grad: GRADIENT_PRESETS.dark },
  { id: "fire", label: "Fogo", grad: GRADIENT_PRESETS.fire },
];

const MAX_STOPS = 8;
const MIN_STOPS = 2;

const toInternalStops = (stops: GradientColorStop[]): InternalStop[] => {
  return stops.map(function (s) { return { ...s, uid: makeUid() }; });
};

const toExternalGradient = (
  stops: InternalStop[],
  type: GradientType,
  angle: number
): GradientOptions => {
  return {
    type,
    angle,
    colorStops: stops.map(function (s) {
      return { offset: s.offset, color: s.color };
    }),
  };
};

type FillMode = "solid" | "gradient";

export const FillColorSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: FillColorSidebarProps) => {
  const [mode, setMode] = useState<FillMode>("solid");

  // Estado do gradiente
  const [stops, setStops] = useState<InternalStop[]>(toInternalStops(DEFAULT_GRADIENT.colorStops));
  const [type, setType] = useState<GradientType>(DEFAULT_GRADIENT.type);
  const [angle, setAngle] = useState<number>(DEFAULT_GRADIENT.angle);
  const [selectedUid, setSelectedUid] = useState<string>("");
  const [draggingUid, setDraggingUid] = useState<string | null>(null);

  const stopBarRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(false);
  const previousActiveToolRef = useRef<ActiveTool>("select");

  const solidValue = editor?.getActiveFillColor() || FILL_COLOR;

  // Inicializa o estado quando abre a sidebar
  useEffect(() => {
    const wasJustOpened =
      activeTool === "fill" && previousActiveToolRef.current !== "fill";
    previousActiveToolRef.current = activeTool;

    if (activeTool !== "fill") {
      hasInitializedRef.current = false;
      return;
    }

    if (!wasJustOpened && hasInitializedRef.current) {
      return;
    }

    // Detecta se o elemento ja tem gradiente ou cor solida
    const currentGradient = editor?.getActiveFillGradient();
    if (currentGradient && currentGradient.colorStops.length >= 2) {
      const internal = toInternalStops(currentGradient.colorStops);
      setStops(internal);
      setType(currentGradient.type);
      setAngle(currentGradient.angle);
      setSelectedUid(internal[0].uid);
      setMode("gradient");
    } else {
      const internal = toInternalStops(DEFAULT_GRADIENT.colorStops);
      setStops(internal);
      setType(DEFAULT_GRADIENT.type);
      setAngle(DEFAULT_GRADIENT.angle);
      setSelectedUid(internal[0].uid);
      setMode("solid");
    }

    hasInitializedRef.current = true;
  }, [editor, activeTool]);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // ============ MODO SOLIDO ============
  const onChangeSolidColor = (value: string) => {
    editor?.changeFillColor(value);
  };

  // ============ MODO GRADIENTE ============
  const applyGradientToCanvas = useCallback(
    (newStops: InternalStop[], newType: GradientType, newAngle: number) => {
      editor?.changeFillGradient(toExternalGradient(newStops, newType, newAngle));
    },
    [editor]
  );

  const updateGradientAll = (
    newStops: InternalStop[],
    newType: GradientType,
    newAngle: number
  ) => {
    setStops(newStops);
    setType(newType);
    setAngle(newAngle);
    applyGradientToCanvas(newStops, newType, newAngle);
  };

  const applyPreset = (preset: GradientOptions) => {
    const internal = toInternalStops(preset.colorStops);
    setStops(internal);
    setType(preset.type);
    setAngle(preset.angle);
    setSelectedUid(internal[0].uid);
    applyGradientToCanvas(internal, preset.type, preset.angle);
  };

  const changeGradType = (newType: GradientType) => {
    updateGradientAll(stops, newType, angle);
  };

  const changeAngle = (newAngle: number) => {
    updateGradientAll(stops, type, newAngle);
  };

  const updateStopByUid = (uid: string, changes: Partial<GradientColorStop>) => {
    const newStops = stops.map(function (s) {
      if (s.uid === uid) return { ...s, ...changes };
      return s;
    });
    updateGradientAll(newStops, type, angle);
  };

  const addStop = (offset: number) => {
    if (stops.length >= MAX_STOPS) return;
    const sorted = [...stops].sort(function (a, b) { return a.offset - b.offset; });
    let nearestColor = sorted[0].color;
    let nearestDist = Math.abs(sorted[0].offset - offset);
    sorted.forEach(function (s) {
      const dist = Math.abs(s.offset - offset);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestColor = s.color;
      }
    });
    const newStop: InternalStop = { uid: makeUid(), offset, color: nearestColor };
    const newStops = [...stops, newStop];
    setStops(newStops);
    setSelectedUid(newStop.uid);
    applyGradientToCanvas(newStops, type, angle);
  };

  const removeStop = (uid: string) => {
    if (stops.length <= MIN_STOPS) return;
    const newStops = stops.filter(function (s) { return s.uid !== uid; });
    setStops(newStops);
    setSelectedUid(newStops[0].uid);
    applyGradientToCanvas(newStops, type, angle);
  };

  const getOffsetFromEvent = (e: React.MouseEvent | MouseEvent): number => {
    if (!stopBarRef.current) return 0;
    const rect = stopBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handleBarClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.stopUid !== undefined) return;
    const offset = getOffsetFromEvent(e);
    addStop(offset);
  };

  const handleStopMouseDown = (uid: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUid(uid);
    setDraggingUid(uid);
  };

  useEffect(() => {
    if (draggingUid === null) return;
    const handleMove = (e: MouseEvent) => {
      const offset = getOffsetFromEvent(e);
      updateStopByUid(draggingUid, { offset });
    };
    const handleUp = () => setDraggingUid(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingUid, stops, type, angle]);

  // ============ TROCA ENTRE ABAS ============
  const switchToSolid = () => {
    setMode("solid");
    // Aplica a primeira cor do gradient atual como cor solida
    const firstColor = stops[0]?.color || FILL_COLOR;
    editor?.changeFillGradient(null); // remove gradient
    editor?.changeFillColor(firstColor);
  };

  const switchToGradient = () => {
    setMode("gradient");
    // Cria um gradient com a cor solida atual + uma cor variante
    const currentSolid = solidValue;
    const newGradient: GradientOptions = {
      type: "linear",
      angle: 90,
      colorStops: [
        { offset: 0, color: currentSolid },
        { offset: 1, color: "#a855f7" },
      ],
    };
    const internal = toInternalStops(newGradient.colorStops);
    setStops(internal);
    setType(newGradient.type);
    setAngle(newGradient.angle);
    setSelectedUid(internal[0].uid);
    applyGradientToCanvas(internal, newGradient.type, newGradient.angle);
  };

  const selectedStop = stops.find(function (s) { return s.uid === selectedUid; });

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "fill" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Cor de preenchimento"
        description="Aplique cor solida ou gradiente"
      />

      <ScrollArea>
        <div className="p-4 space-y-4">

          {/* TABS: Solido vs Gradiente */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={switchToSolid}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-colors",
                mode === "solid"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Droplet className="size-4" />
              Cor solida
            </button>
            <button
              type="button"
              onClick={switchToGradient}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-colors",
                mode === "gradient"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Palette className="size-4" />
              Gradiente
            </button>
          </div>

          {/* ============ MODO SOLIDO ============ */}
          {mode === "solid" && (
            <div className="space-y-6">
              <BrandColorsPalette
                value={solidValue}
                onChange={onChangeSolidColor}
              />
              <ColorPicker
                value={solidValue}
                onChange={onChangeSolidColor}
              />
            </div>
          )}

          {/* ============ MODO GRADIENTE ============ */}
          {mode === "gradient" && (
            <div className="space-y-6">

              {/* Preview */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Preview</Label>
                <div
                  className="w-full h-24 rounded-lg border border-slate-200"
                  style={{ background: gradientToCss(stops, type, angle) }}
                />
              </div>

              {/* Barra de stops */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Cores</Label>
                  <span className="text-[10px] text-slate-500">
                    {stops.length} / {MAX_STOPS}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-2">
                  Clique na barra pra adicionar. Arraste as bolinhas pra reposicionar.
                </p>

                <div className="relative">
                  <div
                    ref={stopBarRef}
                    onClick={handleBarClick}
                    className="w-full h-10 rounded border border-slate-300 cursor-copy relative"
                    style={{ background: gradientToCss(stops, type, angle) }}
                  />

                  <div className="absolute inset-0 pointer-events-none">
                    {stops.map((stop) => {
                      const isSelected = selectedUid === stop.uid;
                      const isDragging = draggingUid === stop.uid;
                      return (
                        <div
                          key={stop.uid}
                          data-stop-uid={stop.uid}
                          onMouseDown={handleStopMouseDown(stop.uid)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUid(stop.uid);
                          }}
                          style={{
                            left: `${stop.offset * 100}%`,
                            transform: "translateX(-50%)",
                          }}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 size-5 rounded-full border-2 cursor-grab pointer-events-auto transition-transform",
                            isSelected ? "border-blue-600 scale-125 z-10" : "border-white",
                            isDragging && "cursor-grabbing scale-150"
                          )}
                        >
                          <div
                            className="size-full rounded-full border border-slate-400"
                            style={{ backgroundColor: stop.color }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Cor selecionada */}
              {selectedStop && (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <Label className="text-sm font-medium">Cor selecionada</Label>

                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={selectedStop.color}
                      onChange={(e) => updateStopByUid(selectedStop.uid, { color: e.target.value })}
                      className="size-10 rounded border border-slate-200 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-mono uppercase text-slate-700">
                        {selectedStop.color}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label className="text-xs text-slate-600">Posicao</Label>
                      <span className="text-xs text-slate-500">
                        {Math.round(selectedStop.offset * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[selectedStop.offset * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(vals) =>
                        updateStopByUid(selectedStop.uid, { offset: vals[0] / 100 })
                      }
                    />
                  </div>

                  {stops.length > MIN_STOPS && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => removeStop(selectedStop.uid)}
                    >
                      <X className="size-4 mr-2" />
                      Remover esta cor
                    </Button>
                  )}
                </div>
              )}

              {/* Presets */}
              <div className="border-t border-slate-200 pt-4">
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
                        style={{
                          background: gradientToCss(
                            toInternalStops(preset.grad.colorStops),
                            preset.grad.type,
                            preset.grad.angle
                          ),
                        }}
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
                    onClick={() => changeGradType("linear")}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                      type === "linear"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Linear
                  </button>
                  <button
                    type="button"
                    onClick={() => changeGradType("radial")}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                      type === "radial"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Radial
                  </button>
                </div>
              </div>

              {/* Angulo */}
              {type === "linear" && (
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm font-medium">Angulo</Label>
                    <span className="text-xs text-slate-500">{Math.round(angle)}°</span>
                  </div>
                  <Slider
                    value={[angle]}
                    min={0}
                    max={360}
                    step={15}
                    onValueChange={(values) => changeAngle(values[0])}
                  />
                </div>
              )}

            </div>
          )}

        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};