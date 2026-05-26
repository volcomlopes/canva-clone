import { useEffect } from "react";
import { fabric } from "fabric";

import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

/**
 * Hover de bordas azuis nos elementos editaveis (modo vendedor).
 * Pinta a borda quando o mouse passa por cima de um elemento editavel.
 */
export const useEditableHover = (canvas: fabric.Canvas | null) => {
  const { data: brandSettings } = useGetBrandSettings();

  useEffect(() => {
    if (!canvas) return;
    if (!brandSettings) return;

    const role = brandSettings.userRole;
    const isSeller = role === "user" || role === "dealership_admin";
    if (!isSeller) return;

    let hoveredObject: fabric.Object | null = null;

    const drawHoverBorder = function () {
      const ctx = canvas.getContext();
      if (!ctx || !hoveredObject) return;

      // @ts-ignore
      const isEditable = hoveredObject.get && hoveredObject.get("isEditable");
      if (!isEditable) return;

      const bound = hoveredObject.getBoundingRect(true, true);
      const viewport = canvas.viewportTransform;

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
    };

    const handleMouseOver = function (e: fabric.IEvent) {
      if (!e.target) return;
      hoveredObject = e.target;
      canvas.requestRenderAll();
    };

    const handleMouseOut = function () {
      hoveredObject = null;
      canvas.requestRenderAll();
    };

    canvas.on("mouse:over", handleMouseOver);
    canvas.on("mouse:out", handleMouseOut);
    canvas.on("after:render", drawHoverBorder);

    return function () {
      canvas.off("mouse:over", handleMouseOver);
      canvas.off("mouse:out", handleMouseOut);
      canvas.off("after:render", drawHoverBorder);
    };
  }, [canvas, brandSettings]);
};