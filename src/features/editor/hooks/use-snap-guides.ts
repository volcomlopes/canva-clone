import { useEffect } from "react";
import { fabric } from "fabric";

const SNAP_THRESHOLD = 5; // pixels - se chegar perto disso, "gruda"
const GUIDE_COLOR = "#3b82f6"; // azul - mesma cor das bordas/seleção

interface GuideLine {
  type: "vertical" | "horizontal";
  position: number;
}

/**
 * Linhas-guia + snap entre elementos quando user move algo.
 * Cobre snap com bordas/centro de outros elementos E com centro do canvas.
 */
export const useSnapGuides = (canvas: fabric.Canvas | null) => {
  useEffect(() => {
    if (!canvas) return;

    let activeGuides: GuideLine[] = [];

    // Helpers pra desenhar as linhas no canvas (sem virar objeto)
    const drawGuides = function () {
      const ctx = canvas.getContext();
      if (!ctx || activeGuides.length === 0) return;

      const viewport = canvas.viewportTransform;
      ctx.save();

      if (viewport) {
        ctx.setTransform(
          viewport[0], viewport[1], viewport[2],
          viewport[3], viewport[4], viewport[5]
        );
      }

      ctx.strokeStyle = GUIDE_COLOR;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const canvasWidth = canvas.getWidth() / (viewport ? viewport[0] : 1);
      const canvasHeight = canvas.getHeight() / (viewport ? viewport[3] : 1);
      const offsetX = viewport ? -viewport[4] / viewport[0] : 0;
      const offsetY = viewport ? -viewport[5] / viewport[3] : 0;

      activeGuides.forEach(function (guide) {
        ctx.beginPath();
        if (guide.type === "vertical") {
          ctx.moveTo(guide.position, offsetY);
          ctx.lineTo(guide.position, offsetY + canvasHeight);
        } else {
          ctx.moveTo(offsetX, guide.position);
          ctx.lineTo(offsetX + canvasWidth, guide.position);
        }
        ctx.stroke();
      });

      ctx.restore();
    };

    const getWorkspace = function (): fabric.Object | null {
      return canvas.getObjects().find(function (o) { return o.name === "clip"; }) || null;
    };

    const handleMoving = function (e: fabric.IEvent) {
      const moving = e.target;
      if (!moving) return;

      activeGuides = [];

      const movingBounds = moving.getBoundingRect(true, true);
      const movingLeft = movingBounds.left;
      const movingRight = movingBounds.left + movingBounds.width;
      const movingCenterX = movingBounds.left + movingBounds.width / 2;
      const movingTop = movingBounds.top;
      const movingBottom = movingBounds.top + movingBounds.height;
      const movingCenterY = movingBounds.top + movingBounds.height / 2;

      // Pontos de referencia (outros elementos + canvas)
      const verticalRefs: { pos: number; matchMoving: number }[] = [];
      const horizontalRefs: { pos: number; matchMoving: number }[] = [];

      // Adiciona refs do workspace (canvas)
      const workspace = getWorkspace();
      if (workspace) {
        const wb = workspace.getBoundingRect(true, true);
        const wLeft = wb.left;
        const wRight = wb.left + wb.width;
        const wCenterX = wb.left + wb.width / 2;
        const wTop = wb.top;
        const wBottom = wb.top + wb.height;
        const wCenterY = wb.top + wb.height / 2;

        // Verticais (compara com left/center/right do moving)
        verticalRefs.push({ pos: wLeft, matchMoving: movingLeft });
        verticalRefs.push({ pos: wLeft, matchMoving: movingCenterX });
        verticalRefs.push({ pos: wLeft, matchMoving: movingRight });
        verticalRefs.push({ pos: wCenterX, matchMoving: movingLeft });
        verticalRefs.push({ pos: wCenterX, matchMoving: movingCenterX });
        verticalRefs.push({ pos: wCenterX, matchMoving: movingRight });
        verticalRefs.push({ pos: wRight, matchMoving: movingLeft });
        verticalRefs.push({ pos: wRight, matchMoving: movingCenterX });
        verticalRefs.push({ pos: wRight, matchMoving: movingRight });

        // Horizontais
        horizontalRefs.push({ pos: wTop, matchMoving: movingTop });
        horizontalRefs.push({ pos: wTop, matchMoving: movingCenterY });
        horizontalRefs.push({ pos: wTop, matchMoving: movingBottom });
        horizontalRefs.push({ pos: wCenterY, matchMoving: movingTop });
        horizontalRefs.push({ pos: wCenterY, matchMoving: movingCenterY });
        horizontalRefs.push({ pos: wCenterY, matchMoving: movingBottom });
        horizontalRefs.push({ pos: wBottom, matchMoving: movingTop });
        horizontalRefs.push({ pos: wBottom, matchMoving: movingCenterY });
        horizontalRefs.push({ pos: wBottom, matchMoving: movingBottom });
      }

      // Adiciona refs dos outros elementos (exceto o moving e o workspace)
      canvas.getObjects().forEach(function (obj) {
        if (obj === moving) return;
        if (obj.name === "clip") return;
        // Pula objetos selecionados junto (multiselect)
        if (canvas.getActiveObjects().indexOf(obj) !== -1) return;

        const ob = obj.getBoundingRect(true, true);
        const oLeft = ob.left;
        const oRight = ob.left + ob.width;
        const oCenterX = ob.left + ob.width / 2;
        const oTop = ob.top;
        const oBottom = ob.top + ob.height;
        const oCenterY = ob.top + ob.height / 2;

        // Verticais
        verticalRefs.push({ pos: oLeft, matchMoving: movingLeft });
        verticalRefs.push({ pos: oLeft, matchMoving: movingCenterX });
        verticalRefs.push({ pos: oLeft, matchMoving: movingRight });
        verticalRefs.push({ pos: oCenterX, matchMoving: movingLeft });
        verticalRefs.push({ pos: oCenterX, matchMoving: movingCenterX });
        verticalRefs.push({ pos: oCenterX, matchMoving: movingRight });
        verticalRefs.push({ pos: oRight, matchMoving: movingLeft });
        verticalRefs.push({ pos: oRight, matchMoving: movingCenterX });
        verticalRefs.push({ pos: oRight, matchMoving: movingRight });

        // Horizontais
        horizontalRefs.push({ pos: oTop, matchMoving: movingTop });
        horizontalRefs.push({ pos: oTop, matchMoving: movingCenterY });
        horizontalRefs.push({ pos: oTop, matchMoving: movingBottom });
        horizontalRefs.push({ pos: oCenterY, matchMoving: movingTop });
        horizontalRefs.push({ pos: oCenterY, matchMoving: movingCenterY });
        horizontalRefs.push({ pos: oCenterY, matchMoving: movingBottom });
        horizontalRefs.push({ pos: oBottom, matchMoving: movingTop });
        horizontalRefs.push({ pos: oBottom, matchMoving: movingCenterY });
        horizontalRefs.push({ pos: oBottom, matchMoving: movingBottom });
      });

      // Checa snaps verticais (eixo X)
      let snapDeltaX = 0;
      let snappedX = false;
      const snappedVerticalPositions = new Set<number>();

      for (const ref of verticalRefs) {
        const diff = ref.pos - ref.matchMoving;
        if (Math.abs(diff) < SNAP_THRESHOLD) {
          if (!snappedX) {
            snapDeltaX = diff;
            snappedX = true;
          }
          snappedVerticalPositions.add(ref.pos);
        }
      }

      // Checa snaps horizontais (eixo Y)
      let snapDeltaY = 0;
      let snappedY = false;
      const snappedHorizontalPositions = new Set<number>();

      for (const ref of horizontalRefs) {
        const diff = ref.pos - ref.matchMoving;
        if (Math.abs(diff) < SNAP_THRESHOLD) {
          if (!snappedY) {
            snapDeltaY = diff;
            snappedY = true;
          }
          snappedHorizontalPositions.add(ref.pos);
        }
      }

      // Aplica snap (move o elemento pra grudar)
      if (snappedX) {
        moving.set({ left: (moving.left || 0) + snapDeltaX });
      }
      if (snappedY) {
        moving.set({ top: (moving.top || 0) + snapDeltaY });
      }
      if (snappedX || snappedY) {
        moving.setCoords();
      }

      // Define as linhas-guia ativas
      snappedVerticalPositions.forEach(function (pos) {
        activeGuides.push({ type: "vertical", position: pos });
      });
      snappedHorizontalPositions.forEach(function (pos) {
        activeGuides.push({ type: "horizontal", position: pos });
      });
    };

    const handleMouseUp = function () {
      activeGuides = [];
      canvas.requestRenderAll();
    };

    canvas.on("object:moving", handleMoving);
    canvas.on("mouse:up", handleMouseUp);
    canvas.on("after:render", drawGuides);

    return function () {
      canvas.off("object:moving", handleMoving);
      canvas.off("mouse:up", handleMouseUp);
      canvas.off("after:render", drawGuides);
    };
  }, [canvas]);
};