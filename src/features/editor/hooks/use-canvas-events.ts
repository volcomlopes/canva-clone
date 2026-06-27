import { fabric } from "fabric";
import { useEffect, useRef } from "react";
import {
  applyCornerRadiusControls,
  updateRadiusHandleOffsets,
} from "@/features/editor/utils/rect-controls";


interface UseCanvasEventsProps {
  save: () => void;
  canvas: fabric.Canvas | null;
  setSelectedObjects: (objects: fabric.Object[]) => void;
  clearSelectionCallback?: () => void;
};

export const useCanvasEvents = ({
  save,
  canvas,
  setSelectedObjects,
  clearSelectionCallback,
}: UseCanvasEventsProps) => {
  const baseRadiusRef = useRef({
    rx: 0,
    ry: 0,
    baseWidth: 0,
    baseHeight: 0,
    active: false,
  });

  useEffect(() => {
    if (canvas) {
      canvas.on("object:added", () => save());
      canvas.on("object:removed", () => save());

      // Guarda o raio "base" ao comecar a interagir
      canvas.on("mouse:down", (e) => {
        const target = e.target;
        if (target && target.type === "rect") {
          // @ts-ignore
          const rx = target.get("rx") || 0;
          // @ts-ignore
          const ry = target.get("ry") || 0;
          const width = (target.width || 0) * (target.scaleX || 1);
          const height = (target.height || 0) * (target.scaleY || 1);
          baseRadiusRef.current = {
            rx,
            ry,
            baseWidth: width,
            baseHeight: height,
            active: rx > 0 || ry > 0,
          };
        } else {
          baseRadiusRef.current.active = false;
        }
      });

      // Durante o drag: ajusta rx/ry inversamente ao scale (raio visual fica constante)
      canvas.on("object:scaling", (e) => {
        const target = e.target;
        if (!target || target.type !== "rect") return;
        if (!baseRadiusRef.current.active) return;

        const scaleX = target.scaleX || 1;
        const scaleY = target.scaleY || 1;
        const corner = (e as any).transform?.corner || "";

        // Cantos (quinas): tl, tr, bl, br -> escala proporcional
        // Laterais: ml, mr, mt, mb -> mantem raio
        const isCorner = ["tl", "tr", "bl", "br"].indexOf(corner) !== -1;

        if (isCorner) {
          // Usa a media do scale pra ambos rx e ry (proporcional)
          const avgScale = (scaleX + scaleY) / 2;
          (target as fabric.Rect).set({
            rx: baseRadiusRef.current.rx * avgScale / scaleX,
            ry: baseRadiusRef.current.ry * avgScale / scaleY,
          });
        } else {
          // Laterais: mantem raio visual constante (compensa o scale)
          (target as fabric.Rect).set({
            rx: baseRadiusRef.current.rx / scaleX,
            ry: baseRadiusRef.current.ry / scaleY,
          });
        }

        // Atualiza posicao das bolinhas durante o resize
        updateRadiusHandleOffsets(target as fabric.Rect);
      });

      // Ao soltar: normaliza tudo (aplica scale no width/height e restaura rx/ry real)
      canvas.on("object:modified", (e) => {
        const target = e.target;
        if (target && target.type === "rect" && baseRadiusRef.current.active) {
          const scaleX = target.scaleX || 1;
          const scaleY = target.scaleY || 1;
          const width = target.width || 0;
          const height = target.height || 0;

          // Pega o rx/ry "visual" atual (compensado pelo scale)
          // @ts-ignore
          const currentRx = (target.get("rx") || 0) * scaleX;
          // @ts-ignore
          const currentRy = (target.get("ry") || 0) * scaleY;

          if (scaleX !== 1 || scaleY !== 1) {
            (target as fabric.Rect).set({
              width: Math.max(1, width * scaleX),
              height: Math.max(1, height * scaleY),
              scaleX: 1,
              scaleY: 1,
              rx: currentRx,
              ry: currentRy,
            });
            target.setCoords();
            updateRadiusHandleOffsets(target as fabric.Rect);
            canvas.requestRenderAll();
          }
        }
        baseRadiusRef.current.active = false;
        save();
      });

      canvas.on("selection:created", (e) => {
        const selected = e.selected || [];
        setSelectedObjects(selected);
        selected.forEach((obj) => {
          // @ts-ignore - ignora o retangulo de recorte do crop
          if (obj.type === "rect" && !obj._isCropRect) {
            applyCornerRadiusControls(obj as fabric.Rect);
          }
        });
        canvas.requestRenderAll();
      });
      canvas.on("selection:updated", (e) => {
        const selected = e.selected || [];
        setSelectedObjects(selected);
        selected.forEach((obj) => {
          // @ts-ignore - ignora o retangulo de recorte do crop
          if (obj.type === "rect" && !obj._isCropRect) {
            applyCornerRadiusControls(obj as fabric.Rect);
          }
        });
        canvas.requestRenderAll();
      });
      canvas.on("selection:cleared", () => {
        setSelectedObjects([]);
        clearSelectionCallback?.();
      });
    }

    return () => {
      if (canvas) {
        canvas.off("object:added");
        canvas.off("object:removed");
        canvas.off("mouse:down");
        canvas.off("object:scaling");
        canvas.off("object:modified");
        canvas.off("selection:created");
        canvas.off("selection:updated");
        canvas.off("selection:cleared");
      }
    };
  },
  [
    save,
    canvas,
    clearSelectionCallback,
    setSelectedObjects
  ]);
};