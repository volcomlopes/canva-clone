import { useEffect } from "react";
import { fabric } from "fabric";

import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

/**
 * Desenha borda azul tracejada PERMANENTE nos elementos editaveis.
 * SO PRA ADMIN. Vendedor usa o useEditableHover.
 */
export const useEditableBorders = (canvas: fabric.Canvas | null) => {
  const { data: brandSettings } = useGetBrandSettings();

  useEffect(() => {
    if (!canvas) return;
    if (!brandSettings) return;

    const role = brandSettings.userRole;
    const isAdmin = role === "brand_admin" || role === "super_admin";
    if (!isAdmin) return; // vendedor nao ve borda permanente

    const handleAfterRender = function () {
      const ctx = canvas.getContext();
      if (!ctx) return;

      const objects = canvas.getObjects();
      const viewport = canvas.viewportTransform;

      objects.forEach(function (obj) {
        // @ts-ignore - propriedade custom
        const isEditable = obj.get && obj.get("isEditable");
        if (!isEditable) return;

        const bound = obj.getBoundingRect(true, true);

        ctx.save();

        if (viewport) {
          ctx.setTransform(
            viewport[0], viewport[1], viewport[2],
            viewport[3], viewport[4], viewport[5]
          );
        }

        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(
          bound.left - 4,
          bound.top - 4,
          bound.width + 8,
          bound.height + 8
        );

        ctx.restore();
      });
    };

    canvas.on("after:render", handleAfterRender);
    canvas.requestRenderAll();

    return function () {
      canvas.off("after:render", handleAfterRender);
    };
  }, [canvas, brandSettings]);
};