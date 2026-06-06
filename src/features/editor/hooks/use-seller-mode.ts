import { useEffect } from "react";
import { fabric } from "fabric";

import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

/**
 * Modo Vendedor: aplica travas quando:
 * 1. Usuario e role "user" ou "dealership_admin"
 * 2. shouldRestrict = true (decidido pelo componente pai)
 *
 * Quem decide shouldRestrict e o editor.tsx, baseado em:
 * - Projeto NORMAL (sem sourceTemplateId): shouldRestrict = false
 * - Projeto vindo de template OFICIAL: shouldRestrict = true
 * - Projeto vindo de template PESSOAL DELE: shouldRestrict = false
 */
export const useSellerMode = (
  canvas: fabric.Canvas | null,
  shouldRestrict: boolean
) => {
  const { data: brandSettings } = useGetBrandSettings();

  useEffect(() => {
    if (!canvas) return;
    if (!brandSettings) return;

    const role = brandSettings.userRole;
    const isSeller = role === "user" || role === "dealership_admin";

    if (!isSeller) return; // admin nao tem restricoes

    const applyLocks = function () {
      const objects = canvas.getObjects();

      if (!shouldRestrict) {
        // Modo livre: vendedor mexe em tudo
        objects.forEach(function (obj) {
          if (obj.name === "clip") return;
          obj.set({
            selectable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            lockRotation: false,
            hasControls: true,
            hoverCursor: "move",
          });
        });
        canvas.requestRenderAll();
        return;
      }

      // Modo restrito: aplica travas baseado em isEditable de cada elemento
      objects.forEach(function (obj) {
        if (obj.name === "clip") return;

        // @ts-ignore - propriedade custom
        const isEditable = obj.get && obj.get("isEditable");

        // DEFAULT = TRAVADO. So libera se isEditable === true
        if (isEditable === true) {
          obj.set({
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            lockRotation: false,
            hasControls: true,
            hoverCursor: "move",
            selectable: true,
            evented: true,
          });
        } else {
          obj.set({
            selectable: false,
            evented: false,
            hoverCursor: "default",
          });
        }
      });

      canvas.requestRenderAll();
    };

    const handleObjectAdded = function () {
      applyLocks();
    };

    canvas.on("object:added", handleObjectAdded);
    applyLocks();

    return function () {
      canvas.off("object:added", handleObjectAdded);
    };
  }, [canvas, brandSettings, shouldRestrict]);
};