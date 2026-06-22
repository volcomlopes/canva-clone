import { fabric } from "fabric";

const HANDLE_RADIUS = 5;
const HANDLE_FILL = "#0066ff";
const HANDLE_STROKE = "#ffffff";
// Offset minimo visual quando o raio chega a zero (pra bolinha ficar dentro)
const MIN_OFFSET = 12;
// Fator pra posicionar a bolinha no meio da curva (45 graus do centro do quarto de circulo)
const DIAGONAL_FACTOR = 1 - Math.SQRT2 / 2; // ≈ 0.293

type Corner = "tl" | "tr" | "bl" | "br";

// Posicoes base no bounding box (x, y de -0.5 a 0.5)
const CORNER_POSITIONS: Record<Corner, { x: number; y: number }> = {
  tl: { x: -0.5, y: -0.5 },
  tr: { x: 0.5, y: -0.5 },
  bl: { x: -0.5, y: 0.5 },
  br: { x: 0.5, y: 0.5 },
};

// Sinal pra empurrar o offset PRA DENTRO da forma
const CORNER_SIGN: Record<Corner, { x: number; y: number }> = {
  tl: { x: 1, y: 1 },
  tr: { x: -1, y: 1 },
  bl: { x: 1, y: -1 },
  br: { x: -1, y: -1 },
};

const renderHandle = function (
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: any,
  _fabricObject: fabric.Object
) {
  ctx.save();
  ctx.fillStyle = HANDLE_FILL;
  ctx.strokeStyle = HANDLE_STROKE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(left, top, HANDLE_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

const createActionHandler = (corner: Corner) =>
  function (_eventData: any, transform: any, x: number, y: number) {
    const target = transform.target as fabric.Rect;
    if (target.type !== "rect") return false;

    const mouseLocal = target.toLocalPoint(
      new fabric.Point(x, y),
      "center",
      "center"
    );

    const w = target.width || 0;
    const h = target.height || 0;
    const scaleX = target.scaleX || 1;
    const scaleY = target.scaleY || 1;

    let dx = 0, dy = 0;
    switch (corner) {
      case "tl":
        dx = mouseLocal.x + w / 2;
        dy = mouseLocal.y + h / 2;
        break;
      case "tr":
        dx = w / 2 - mouseLocal.x;
        dy = mouseLocal.y + h / 2;
        break;
      case "bl":
        dx = mouseLocal.x + w / 2;
        dy = h / 2 - mouseLocal.y;
        break;
      case "br":
        dx = w / 2 - mouseLocal.x;
        dy = h / 2 - mouseLocal.y;
        break;
    }

    const clampedDx = Math.max(0, dx);
    const clampedDy = Math.max(0, dy);
    const mouseDist = Math.min(clampedDx, clampedDy);

    const visualW = w * scaleX;
    const visualH = h * scaleY;
    const maxVisualRadius = Math.min(visualW, visualH) / 2;
    const minScale = Math.min(scaleX, scaleY);
    const maxLocalRadius = maxVisualRadius / minScale;

    // Resolve o raio iterativamente: bolinha esta a (raio * factor) do canto,
    // mas o factor depende do raio. Fazemos uma busca binaria rapida.
    let lo = 0;
    let hi = maxLocalRadius;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      const visualMid = mid * minScale;
      const progress = maxVisualRadius > 0 ? visualMid / maxVisualRadius : 0;
      const factor = 0.55 + (0.60 - 0.55) * progress;
      const computedDist = mid * factor * minScale;
      if (computedDist < mouseDist) lo = mid;
      else hi = mid;
    }
    let radius = Math.min((lo + hi) / 2, maxLocalRadius);

    (target as fabric.Rect).set({ rx: radius, ry: radius });
    updateRadiusHandleOffsets(target as fabric.Rect);

    target.canvas?.requestRenderAll();
    return true;
  };

/**
 * Atualiza os offsets dos handles de raio baseado no rx/ry atual e no scale.
 * Deve ser chamada sempre que o raio ou o scale mudam.
 */
export const updateRadiusHandleOffsets = (rect: fabric.Rect) => {
  if (rect.type !== "rect") return;
  // @ts-ignore
  const rx = rect.rx || 0;
  // @ts-ignore
  const ry = rect.ry || 0;
  const scaleX = rect.scaleX || 1;
  const scaleY = rect.scaleY || 1;

  const visualWidth = (rect.width || 0) * scaleX;
  const visualHeight = (rect.height || 0) * scaleY;
  const maxRadius = Math.min(visualWidth, visualHeight) / 2;

  const visualRx = Math.min(rx * scaleX, maxRadius);
  const visualRy = Math.min(ry * scaleY, maxRadius);

  // Progresso de 0 (raio zero) a 1 (raio maximo = circulo)
  const progress = maxRadius > 0 ? Math.min(visualRx, visualRy) / maxRadius : 0;

  // Fator interpola: MIN_FACTOR (raio pequeno) -> MAX_FACTOR (circulo)
  const MIN_FACTOR = 0.55; // mais margem da borda quando o raio e pequeno
  const MAX_FACTOR = 0.60; // bolinhas mais ao centro quando vira circulo
  const factor = MIN_FACTOR + (MAX_FACTOR - MIN_FACTOR) * progress;

  let offsetMagX = visualRx * factor;
  let offsetMagY = visualRy * factor;

  if (offsetMagX < MIN_OFFSET) offsetMagX = MIN_OFFSET;
  if (offsetMagY < MIN_OFFSET) offsetMagY = MIN_OFFSET;

  const corners: Corner[] = ["tl", "tr", "bl", "br"];
  corners.forEach((corner) => {
    const ctrl = (rect.controls as any)[`radius_${corner}`];
    if (ctrl) {
      const sign = CORNER_SIGN[corner];
      ctrl.offsetX = offsetMagX * sign.x;
      ctrl.offsetY = offsetMagY * sign.y;
    }
  });
};

export const applyCornerRadiusControls = (rect: fabric.Rect) => {
  if (rect.type !== "rect") return;

  rect.controls = { ...fabric.Object.prototype.controls };

  const corners: Corner[] = ["tl", "tr", "bl", "br"];
  corners.forEach((corner) => {
    const pos = CORNER_POSITIONS[corner];
    (rect.controls as any)[`radius_${corner}`] = new fabric.Control({
      x: pos.x,
      y: pos.y,
      offsetX: 0,
      offsetY: 0,
      actionHandler: createActionHandler(corner) as any,
      cursorStyle: "pointer",
      render: renderHandle,
      actionName: "modifyRadius",
    } as any);
  });

  updateRadiusHandleOffsets(rect);
};