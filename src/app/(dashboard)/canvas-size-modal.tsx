"use client";

import { useState } from "react";
import { Loader2, AlertCircle, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  CANVAS_SIZES,
  CATEGORIES,
  CanvasSize,
} from "@/features/projects/canvas-sizes";

interface CanvasSizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (width: number, height: number) => void;
  isCreating: boolean;
  mode?: "create" | "resize";
  currentWidth?: number;
  currentHeight?: number;
}

const MIN_SIZE = 100;
const MAX_SIZE = 10000;
const SHRINK_THRESHOLD = 0.8; // se reduzir mais que 20%, alerta

export const CanvasSizeModal = ({
  open,
  onOpenChange,
  onSelect,
  isCreating,
  mode = "create",
  currentWidth,
  currentHeight,
}: CanvasSizeModalProps) => {
  const [customWidth, setCustomWidth] = useState(
    currentWidth ? String(currentWidth) : "1080"
  );
  const [customHeight, setCustomHeight] = useState(
    currentHeight ? String(currentHeight) : "1080"
  );
  const [validationError, setValidationError] = useState("");
  const [pendingResize, setPendingResize] = useState<{ w: number; h: number } | null>(null);

  const validateCustom = (): { ok: boolean; w: number; h: number } => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);

    if (isNaN(w) || isNaN(h)) {
      setValidationError("Digite numeros validos para largura e altura.");
      return { ok: false, w: 0, h: 0 };
    }
    if (w < MIN_SIZE || h < MIN_SIZE) {
      setValidationError(`Tamanho minimo: ${MIN_SIZE}x${MIN_SIZE} px.`);
      return { ok: false, w, h };
    }
    if (w > MAX_SIZE || h > MAX_SIZE) {
      setValidationError(`Tamanho maximo: ${MAX_SIZE}x${MAX_SIZE} px.`);
      return { ok: false, w, h };
    }
    setValidationError("");
    return { ok: true, w, h };
  };

  // Decide se precisa alertar antes de aplicar
  const shouldAlertShrink = (newW: number, newH: number): boolean => {
    if (mode !== "resize") return false;
    if (!currentWidth || !currentHeight) return false;

    const ratioW = newW / currentWidth;
    const ratioH = newH / currentHeight;

    return ratioW < SHRINK_THRESHOLD || ratioH < SHRINK_THRESHOLD;
  };

  const applyChange = (w: number, h: number) => {
    if (shouldAlertShrink(w, h)) {
      setPendingResize({ w, h });
      return;
    }
    onSelect(w, h);
  };

  const handlePresetClick = (size: CanvasSize) => {
    if (isCreating) return;
    applyChange(size.width, size.height);
  };

  const handleCustomSubmit = () => {
    const result = validateCustom();
    if (!result.ok) return;
    applyChange(result.w, result.h);
  };

  const confirmShrink = () => {
    if (pendingResize) {
      onSelect(pendingResize.w, pendingResize.h);
      setPendingResize(null);
    }
  };

  const cancelShrink = () => {
    setPendingResize(null);
  };

  const handleWidthChange = (val: string) => {
    setCustomWidth(val);
    if (validationError) setValidationError("");
  };

  const handleHeightChange = (val: string) => {
    setCustomHeight(val);
    if (validationError) setValidationError("");
  };

  const title = mode === "resize" ? "Redimensionar Canvas" : "Novo Projeto";
  const description = mode === "resize"
    ? "Escolha um novo tamanho. Os elementos atuais sao mantidos."
    : "Escolha um tamanho pre-definido ou crie um personalizado";

  // Tela de confirmacao de shrink
  if (pendingResize) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Atencao: tamanho menor
            </DialogTitle>
            <DialogDescription>
              O novo tamanho ({pendingResize.w}x{pendingResize.h}) e bem menor que o atual ({currentWidth}x{currentHeight}).
              Alguns elementos podem ficar fora do canvas e voce vai precisar reposiciona-los.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={cancelShrink}>
              Cancelar
            </Button>
            <Button onClick={confirmShrink}>
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isCreating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">
                {mode === "resize" ? "Aplicando..." : "Criando projeto..."}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6 py-2">
          {CATEGORIES.map((category) => {
            const sizes = CANVAS_SIZES.filter(function (s) {
              return s.category === category.id;
            });

            return (
              <div key={category.id}>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={function () { handlePresetClick(size); }}
                      disabled={isCreating}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {size.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {size.width} x {size.height} px
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Personalizado */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>📐</span>
              Tamanho Personalizado
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Minimo: {MIN_SIZE} px - Maximo: {MAX_SIZE} px
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="custom-width" className="text-xs text-slate-600">
                  Largura (px)
                </Label>
                <Input
                  id="custom-width"
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={customWidth}
                  onChange={function (e) { handleWidthChange(e.target.value); }}
                  disabled={isCreating}
                  className={validationError ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="custom-height" className="text-xs text-slate-600">
                  Altura (px)
                </Label>
                <Input
                  id="custom-height"
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={customHeight}
                  onChange={function (e) { handleHeightChange(e.target.value); }}
                  disabled={isCreating}
                  className={validationError ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
              </div>
              <Button
                onClick={handleCustomSubmit}
                disabled={isCreating}
              >
                {mode === "resize" ? "Aplicar" : "Criar"}
              </Button>
            </div>

            {validationError && (
              <div className="mt-2 flex items-center gap-2 text-red-600">
                <AlertCircle className="size-4 flex-shrink-0" />
                <p className="text-xs">{validationError}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};