import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef } from "react";
import { jsPDF } from "jspdf";
import {
  applyCornerRadiusControls,
  updateRadiusHandleOffsets,
} from "@/features/editor/utils/rect-controls";



import {
  Editor,
  FILL_COLOR,
  STROKE_WIDTH,
  STROKE_COLOR,
  GradientOptions,
  GradientType,
  CIRCLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  BuildEditorProps,
  RECTANGLE_OPTIONS,
  EditorHookProps,
  STROKE_DASH_ARRAY,
  ShadowOptions,
  TEXT_OPTIONS,
  FONT_FAMILY,
  FONT_WEIGHT,
  FONT_SIZE,
  JSON_KEYS,
  LINE_OPTIONS,
  STAR_OPTIONS,
  ARROW_OPTIONS,
} from "@/features/editor/types";
import { useHistory } from "@/features/editor/hooks/use-history";
import {
  createFilter,
  downloadFile,
  isTextType,
  transformText
} from "@/features/editor/utils";
import { useHotkeys } from "@/features/editor/hooks/use-hotkeys";
import { useClipboard } from "@/features/editor/hooks//use-clipboard";
import { useAutoResize } from "@/features/editor/hooks/use-auto-resize";
import { useCanvasEvents } from "@/features/editor/hooks/use-canvas-events";
import { useWindowEvents } from "@/features/editor/hooks/use-window-events";
import { useLoadState } from "@/features/editor/hooks/use-load-state";

const buildEditor = ({
  save,
  undo,
  redo,
  canRedo,
  canUndo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  fontFamily,
  setFontFamily,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  selectedObjects,
  strokeDashArray,
  setStrokeDashArray,
}: BuildEditorProps): Editor => {

// Atualiza as 4 tarjas escuras ao redor da janela de recorte
  const updateCropOverlay = () => {
    // @ts-ignore
    const rect = canvas._cropRect as fabric.Rect | undefined;
    // @ts-ignore
    const bounds = canvas._cropBounds as
      | { left: number; top: number; width: number; height: number }
      | undefined;
    // @ts-ignore
    const shades = canvas._cropShades as fabric.Rect[] | undefined;

    if (!rect || !bounds || !shades || shades.length !== 4) {
      return;
    }

    const rLeft = rect.left || 0;
    const rTop = rect.top || 0;
    const rW = rect.getScaledWidth();
    const rH = rect.getScaledHeight();

    const bLeft = bounds.left;
    const bTop = bounds.top;
    const bW = bounds.width;
    const bH = bounds.height;

    const [top, bottom, left, right] = shades;

    // Tarja de cima: cobre da borda superior ate o topo da janela
    top.set({
      left: bLeft,
      top: bTop,
      width: bW,
      height: Math.max(0, rTop - bTop),
    });

    // Tarja de baixo: do fim da janela ate a borda inferior
    bottom.set({
      left: bLeft,
      top: rTop + rH,
      width: bW,
      height: Math.max(0, bTop + bH - (rTop + rH)),
    });

    // Tarja esquerda: so na faixa vertical da janela
    left.set({
      left: bLeft,
      top: rTop,
      width: Math.max(0, rLeft - bLeft),
      height: rH,
    });

    // Tarja direita
    right.set({
      left: rLeft + rW,
      top: rTop,
      width: Math.max(0, bLeft + bW - (rLeft + rW)),
      height: rH,
    });

    shades.forEach((s) => s.setCoords());
  };

  // Aplica o crop de fato (usado pelo botao Aplicar e pelo clicar-fora)
  const editorApplyCrop = () => {
    // @ts-ignore
    const image = canvas._cropTarget as fabric.Image | undefined;
    // @ts-ignore
    const rect = canvas._cropRect as fabric.Rect | undefined;
    // @ts-ignore
    const shades = canvas._cropShades as fabric.Rect[] | undefined;

    // Remove listeners
    // @ts-ignore
    if (canvas._cropMouseDown) {
      // @ts-ignore
      canvas.off("mouse:down:before", canvas._cropMouseDown);
      // @ts-ignore
      canvas._cropMouseDown = undefined;
    }
    // @ts-ignore
    if (canvas._cropMoving) {
      // @ts-ignore
      canvas.off("object:moving", canvas._cropMoving);
      // @ts-ignore
      canvas.off("object:scaling", canvas._cropMoving);
      // @ts-ignore
      canvas._cropMoving = undefined;
    }

    // @ts-ignore
    const onEnd = canvas._cropOnEnd as (() => void) | undefined;
    // @ts-ignore
    canvas._cropOnEnd = undefined;

    const cleanup = () => {
      if (rect) canvas.remove(rect);
      if (shades) shades.forEach((s) => canvas.remove(s));
      // @ts-ignore
      canvas._cropTarget = undefined;
      // @ts-ignore
      canvas._cropRect = undefined;
      // @ts-ignore
      canvas._cropShades = undefined;
      // @ts-ignore
      canvas._cropBounds = undefined;
      // @ts-ignore
      canvas._cropSaved = undefined;
    };

    if (!image || !rect) {
      canvas.discardActiveObject();
      cleanup();
      canvas.requestRenderAll();
      onEnd?.();
      return;
    }

    const scaleX = image.scaleX || 1;
    const scaleY = image.scaleY || 1;

    // Agora a imagem esta INTEIRA (cropX/Y = 0), entao o calculo eh direto
    const imgLeft = image.left || 0;
    const imgTop = image.top || 0;

    const rectLeft = rect.left || 0;
    const rectTop = rect.top || 0;
    const rectWidth = rect.getScaledWidth();
    const rectHeight = rect.getScaledHeight();

    let newCropX = (rectLeft - imgLeft) / scaleX;
    let newCropY = (rectTop - imgTop) / scaleY;
    let newWidth = rectWidth / scaleX;
    let newHeight = rectHeight / scaleY;

    const element = image.getElement() as HTMLImageElement;
    const naturalW = element.naturalWidth || image.width || 0;
    const naturalH = element.naturalHeight || image.height || 0;

    if (newCropX < 0) newCropX = 0;
    if (newCropY < 0) newCropY = 0;
    if (newCropX + newWidth > naturalW) newWidth = naturalW - newCropX;
    if (newCropY + newHeight > naturalH) newHeight = naturalH - newCropY;

    canvas.discardActiveObject();

    if (newWidth < 10 || newHeight < 10) {
      // area minuscula: restaura o crop salvo
      // @ts-ignore
      const saved = canvas._cropSaved;
      if (saved) {
        image.set({
          cropX: saved.cropX,
          cropY: saved.cropY,
          width: saved.width,
          height: saved.height,
          left: saved.left,
          top: saved.top,
        });
      }
      image.set({ selectable: true, evented: true });
      image.setCoords();
      cleanup();
      canvas.setActiveObject(image);
      canvas.requestRenderAll();
      onEnd?.();
      return;
    }

    image.set({
      cropX: newCropX,
      cropY: newCropY,
      width: newWidth,
      height: newHeight,
      left: rectLeft,
      top: rectTop,
      selectable: true,
      evented: true,
    });
    image.setCoords();

    cleanup();

    canvas.setActiveObject(image);
    canvas.requestRenderAll();
    save();
    onEnd?.();
  };

  const generateSaveOptions = () => {
    const { width, height, left, top } = getWorkspace() as fabric.Rect;

    return {
      name: "Image",
      format: "png",
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const savePng = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, "png");
    autoZoom();
  };

  const savePdf = (dpi: "screen" | "print" = "screen") => {
    const workspace = getWorkspace() as fabric.Rect;
    const width = workspace?.width || 1080;
    const height = workspace?.height || 1080;

    // Tela = 1x (72dpi base do Fabric). Impressao = ~4x pra chegar perto de 300dpi
    const multiplier = dpi === "print" ? 4 : 1;

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const dataUrl = canvas.toDataURL({
      width: width,
      height: height,
      left: workspace.left,
      top: workspace.top,
      format: "jpeg",
      quality: 1,
      multiplier: multiplier,
    });

    // Cria um PDF do tamanho EXATO da arte (em pixels = pontos pt)
    const orientation = width > height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "px",
      format: [width, height],
    });

    pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
    pdf.save("artbase-export.pdf");

    autoZoom();
  };
  
  const generateThumbnail = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // Limita o thumbnail a 800px na maior dimensao pra evitar
    // arquivos grandes que estouram o limite de upload (2MB)
    const MAX_THUMB_DIMENSION = 800;
    const workspace = getWorkspace() as fabric.Rect;
    const wsWidth = workspace.width || 1080;
    const wsHeight = workspace.height || 1080;
    const largerSide = Math.max(wsWidth, wsHeight);

    let multiplier = 1;
    if (largerSide > MAX_THUMB_DIMENSION) {
      multiplier = MAX_THUMB_DIMENSION / largerSide;
    }

    const dataUrl = canvas.toDataURL({
      ...options,
      multiplier: multiplier,
    });

    autoZoom();
    return dataUrl;
  };

  const saveSvg = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, "svg");
    autoZoom();
  };

  const saveJpg = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, "jpg");
    autoZoom();
  };

  const saveJson = async () => {
    const dataUrl = canvas.toJSON(JSON_KEYS);

    await transformText(dataUrl.objects);
    const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataUrl, null, "\t"),
    )}`;
    downloadFile(fileString, "json");
  };

  const loadJson = (json: string) => {
    const data = JSON.parse(json);

    canvas.loadFromJSON(data, () => {
      autoZoom();
    });
  };

  const getWorkspace = () => {
    return canvas
    .getObjects()
    .find((object) => object.name === "clip");
  };

  const center = (object: fabric.Object) => {
    const workspace = getWorkspace();
    const center = workspace?.getCenterPoint();

    if (!center) return;

    // @ts-ignore
    canvas._centerObject(object, center);
  };

  const addToCanvas = (object: fabric.Object) => {
    center(object);
    canvas.add(object);
    canvas.setActiveObject(object);
  };

  return {
    savePng,
    saveJpg,
    saveSvg,
    saveJson,
    savePdf,
    loadJson,
    generateThumbnail,
    canUndo,
    canRedo,
    autoZoom,
    getWorkspace,
    zoomIn: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio += 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio > 1 ? 1 : zoomRatio
      );
    },
    zoomOut: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio -= 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio < 0.2 ? 0.2 : zoomRatio,
      );
    },
    changeSize: (value: { width: number; height: number }) => {
      const workspace = getWorkspace();

      workspace?.set(value);
      autoZoom();
      save();
    },
    changeBackground: (value: string) => {
      const workspace = getWorkspace();
      workspace?.set({ fill: value });
      canvas.renderAll();
      save();
    },
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },
    onUndo: () => undo(),
    onRedo: () => redo(),
    onCopy: () => copy(),
    onPaste: () => paste(),
    changeImageFilter: (value: string) => {
      const objects = canvas.getActiveObjects();
      objects.forEach((object) => {
        if (object.type === "image") {
          const imageObject = object as fabric.Image;

          const effect = createFilter(value);

          imageObject.filters = effect ? [effect] : [];
          imageObject.applyFilters();
          canvas.renderAll();
        }
      });
      save();
    },

    startCrop: (onEnd?: () => void) => {
      // @ts-ignore
      if (canvas._cropRect) {
        // limpa um crop anterior pendente
        // @ts-ignore
        if (canvas._cropMouseDown) {
          // @ts-ignore
          canvas.off("mouse:down:before", canvas._cropMouseDown);
          // @ts-ignore
          canvas._cropMouseDown = undefined;
        }
        // @ts-ignore
        if (canvas._cropMoving) {
          // @ts-ignore
          canvas.off("object:moving", canvas._cropMoving);
          // @ts-ignore
          canvas.off("object:scaling", canvas._cropMoving);
          // @ts-ignore
          canvas._cropMoving = undefined;
        }
        canvas.discardActiveObject();
        // @ts-ignore
        canvas.remove(canvas._cropRect);
        // @ts-ignore
        (canvas._cropShades || []).forEach((s: fabric.Rect) => canvas.remove(s));
        // @ts-ignore
        if (canvas._cropTarget) {
          // @ts-ignore
          canvas._cropTarget.set({ selectable: true, evented: true });
        }
        // @ts-ignore
        canvas._cropRect = undefined;
        // @ts-ignore
        canvas._cropShades = undefined;
        // @ts-ignore
        canvas._cropBounds = undefined;
        // @ts-ignore
        canvas._cropTarget = undefined;
        // @ts-ignore
        canvas._cropOnEnd = undefined;
      }

      const image = canvas.getActiveObject() as fabric.Image;

      if (!image || image.type !== "image") {
        return;
      }

      // Estado atual do crop (pra restaurar no cancel)
      const savedCrop = {
        cropX: image.cropX || 0,
        cropY: image.cropY || 0,
        width: image.width || 0,
        height: image.height || 0,
        left: image.left || 0,
        top: image.top || 0,
      };
      // @ts-ignore
      canvas._cropSaved = savedCrop;

      const scaleX = image.scaleX || 1;
      const scaleY = image.scaleY || 1;

      const element = image.getElement() as HTMLImageElement;
      const naturalW = element.naturalWidth || image.width || 0;
      const naturalH = element.naturalHeight || image.height || 0;

      // A janela de recorte atual (onde a imagem esta hoje, na tela)
      const windowLeft = image.left || 0;
      const windowTop = image.top || 0;
      const windowW = image.getScaledWidth();
      const windowH = image.getScaledHeight();

      // Revela a imagem ORIGINAL inteira por baixo:
      // tira o crop e reposiciona pra borda da janela continuar no mesmo lugar
      const fullLeft = windowLeft - (image.cropX || 0) * scaleX;
      const fullTop = windowTop - (image.cropY || 0) * scaleY;

      image.set({
        cropX: 0,
        cropY: 0,
        width: naturalW,
        height: naturalH,
        left: fullLeft,
        top: fullTop,
        selectable: false,
        evented: false,
      });
      image.setCoords();

      // Limites da imagem inteira na tela (onde o escuro pode existir)
      const boundsLeft = fullLeft;
      const boundsTop = fullTop;
      const boundsWidth = naturalW * scaleX;
      const boundsHeight = naturalH * scaleY;

      // @ts-ignore
      canvas._cropBounds = {
        left: boundsLeft,
        top: boundsTop,
        width: boundsWidth,
        height: boundsHeight,
      };

      // 4 tarjas escuras
      const makeShade = () =>
        new fabric.Rect({
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          fill: "rgba(0,0,0,0.55)",
          selectable: false,
          evented: false,
          objectCaching: false,
          excludeFromExport: true,
          hoverCursor: "default",
        });

      const shades = [makeShade(), makeShade(), makeShade(), makeShade()];
      shades.forEach((s) => canvas.add(s));
      // @ts-ignore
      canvas._cropShades = shades;

      // Retangulo de recorte (a janela), comeca onde a imagem estava antes
      const rect = new fabric.Rect({
        left: windowLeft,
        top: windowTop,
        width: windowW,
        height: windowH,
        fill: "rgba(0,0,0,0.0)",
        stroke: "#3b82f6",
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        cornerColor: "#3b82f6",
        cornerStrokeColor: "#ffffff",
        cornerStyle: "circle",
        cornerSize: 12,
        transparentCorners: false,
        hasRotatingPoint: false,
        lockRotation: true,
        objectCaching: false,
        excludeFromExport: true,
      });

      rect.setControlsVisibility({
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        mtr: false,
        tl: true,
        tr: true,
        bl: true,
        br: true,
      });

      // @ts-ignore
      canvas._cropTarget = image;
      // Marca como rect de recorte pra o radius nunca grudar nele
      // @ts-ignore
      rect._isCropRect = true;
      // @ts-ignore
      canvas._cropRect = rect;
      // @ts-ignore
      canvas._cropOnEnd = onEnd;

      canvas.add(rect);
      canvas.setActiveObject(rect);

      updateCropOverlay();

      // Atualiza o escuro em tempo real ao arrastar/redimensionar a janela
      const onMoving = () => {
        updateCropOverlay();
      };
      // @ts-ignore
      canvas._cropMoving = onMoving;
      canvas.on("object:moving", onMoving);
      canvas.on("object:scaling", onMoving);

      // Clicar fora aplica
      const onMouseDown = (opt: fabric.IEvent) => {
        // @ts-ignore
        if (!canvas._cropTarget || !canvas._cropRect) return;
        // @ts-ignore
        if (opt.target === canvas._cropRect) return;
        editorApplyCrop();
      };
      // @ts-ignore
      canvas._cropMouseDown = onMouseDown;
      canvas.on("mouse:down:before", onMouseDown);

      canvas.requestRenderAll();
    },
    applyCrop: () => {
      editorApplyCrop();
    },
    cancelCrop: () => {
      // @ts-ignore
      const image = canvas._cropTarget as fabric.Image | undefined;
      // @ts-ignore
      const rect = canvas._cropRect as fabric.Rect | undefined;
      // @ts-ignore
      const shades = canvas._cropShades as fabric.Rect[] | undefined;
      // @ts-ignore
      const saved = canvas._cropSaved;

      // @ts-ignore
      if (canvas._cropMouseDown) {
        // @ts-ignore
        canvas.off("mouse:down:before", canvas._cropMouseDown);
        // @ts-ignore
        canvas._cropMouseDown = undefined;
      }
      // @ts-ignore
      if (canvas._cropMoving) {
        // @ts-ignore
        canvas.off("object:moving", canvas._cropMoving);
        // @ts-ignore
        canvas.off("object:scaling", canvas._cropMoving);
        // @ts-ignore
        canvas._cropMoving = undefined;
      }

      // @ts-ignore
      const onEnd = canvas._cropOnEnd as (() => void) | undefined;
      // @ts-ignore
      canvas._cropOnEnd = undefined;

      canvas.discardActiveObject();

      if (rect) canvas.remove(rect);
      if (shades) shades.forEach((s) => canvas.remove(s));

      // Restaura o crop que existia antes
      if (image && saved) {
        image.set({
          cropX: saved.cropX,
          cropY: saved.cropY,
          width: saved.width,
          height: saved.height,
          left: saved.left,
          top: saved.top,
          selectable: true,
          evented: true,
        });
        image.setCoords();
        canvas.setActiveObject(image);
      }

      // @ts-ignore
      canvas._cropTarget = undefined;
      // @ts-ignore
      canvas._cropRect = undefined;
      // @ts-ignore
      canvas._cropShades = undefined;
      // @ts-ignore
      canvas._cropBounds = undefined;
      // @ts-ignore
      canvas._cropSaved = undefined;

      canvas.requestRenderAll();
      onEnd?.();
    },
    isCropping: () => {
      // @ts-ignore
      return !!canvas._cropTarget;
    },

    addImage: (value: string) => {
      fabric.Image.fromURL(
        value,
        (image) => {
          const workspace = getWorkspace();

          image.scaleToWidth(workspace?.width || 0);
          image.scaleToHeight(workspace?.height || 0);

          addToCanvas(image);
        },
        {
          crossOrigin: "anonymous",
        },
      );
    },
    delete: () => {
      canvas.getActiveObjects().forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    addText: (value, options) => {
      const object = new fabric.Textbox(value, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        ...options,
      });

      addToCanvas(object);
    },
    getActiveOpacity: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return 1;
      }

      const value = selectedObject.get("opacity") || 1;

      return value;
    },
    changeFontSize: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontSize exists.
          object.set({ fontSize: value });
        }
      });
      canvas.renderAll();
      save();
    },
    getActiveFontSize: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return FONT_SIZE;
      }

      // @ts-ignore
      // Faulty TS library, fontSize exists.
      const value = selectedObject.get("fontSize") || FONT_SIZE;

      return value;
    },

changeFontLineHeight: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, lineHeight exists.
          object.set({ lineHeight: value });
        }
      });
      canvas.renderAll();
      save();
    },
    getActiveFontLineHeight: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return 1.16;
      }

      // @ts-ignore
      // Faulty TS library, lineHeight exists.
      const value = selectedObject.get("lineHeight") || 1.16;

      return value;
    },
    changeFontCharSpacing: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, charSpacing exists.
          object.set({ charSpacing: value });
        }
      });
      canvas.renderAll();
      save();
    },
    getActiveFontCharSpacing: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return 0;
      }

      // @ts-ignore
      // Faulty TS library, charSpacing exists.
      const value = selectedObject.get("charSpacing") || 0;

      return value;
    },
    changeFillRadius: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (object.type === "rect") {
          const scaleX = object.scaleX || 1;
          const scaleY = object.scaleY || 1;
          // Tamanho VISUAL da forma
          const visualWidth = (object.width || 0) * scaleX;
          const visualHeight = (object.height || 0) * scaleY;
          // Raio maximo possivel = metade da menor dimensao visual
          const maxRadius = Math.min(visualWidth, visualHeight) / 2;
          // Clamp do valor pedido
          const clampedValue = Math.min(value, maxRadius);

          (object as fabric.Rect).set({
            rx: clampedValue / scaleX,
            ry: clampedValue / scaleY,
          });
          updateRadiusHandleOffsets(object as fabric.Rect);
        }
      });
      canvas.requestRenderAll();
      save();
    },
    getActiveFillRadius: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject || selectedObject.type !== "rect") {
        return 0;
      }

      // @ts-ignore
      const rx = selectedObject.get("rx") || 0;
      const scaleX = selectedObject.scaleX || 1;
      return Math.round(rx * scaleX);
    },

    changeTextAlign: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, textAlign exists.
          object.set({ textAlign: value });
        }
      });
      canvas.renderAll();
      save();
    },
    getActiveTextAlign: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return "left";
      }

      // @ts-ignore
      // Faulty TS library, textAlign exists.
      const value = selectedObject.get("textAlign") || "left";

      return value;
    },
    changeFontUnderline: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, underline exists.
          object.set({ underline: value });
        }
      });
      canvas.renderAll();
      save();
    },
    getActiveFontUnderline: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return false;
      }

      // @ts-ignore
      // Faulty TS library, underline exists.
      const value = selectedObject.get("underline") || false;

      return value;
    },
    changeFontLinethrough: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, linethrough exists.
          object.set({ linethrough: value });
        }
      });
      canvas.renderAll();
      save();
    },
    getActiveFontLinethrough: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return false;
      }

      // @ts-ignore
      // Faulty TS library, linethrough exists.
      const value = selectedObject.get("linethrough") || false;

      return value;
    },
    changeFontStyle: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontStyle exists.
          object.set({ fontStyle: value });
        }
      });
      canvas.renderAll();
      save();
    },
    getActiveFontStyle: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return "normal";
      }

      // @ts-ignore
      // Faulty TS library, fontStyle exists.
      const value = selectedObject.get("fontStyle") || "normal";

      return value;
    },
    changeFontWeight: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontWeight exists.
          object.set({ fontWeight: value });
        }
      });
      canvas.renderAll();
      save();
    },

    changeShadow: (shadow: ShadowOptions | null) => {
      canvas.getActiveObjects().forEach((object) => {
        if (shadow === null) {
          object.set({ shadow: null as any });
        } else {
          const fabricShadow = new fabric.Shadow({
            color: shadow.color,
            blur: shadow.blur,
            offsetX: shadow.offsetX,
            offsetY: shadow.offsetY,
          });
          object.set({ shadow: fabricShadow });
        }
      });
      canvas.requestRenderAll();
      save();
    },

    getActiveShadow: (): ShadowOptions | null => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return null;

      const shadow = selectedObject.get("shadow") as fabric.Shadow | null;
      if (!shadow) return null;

      return {
        color: shadow.color || "rgba(0,0,0,0.3)",
        blur: shadow.blur || 0,
        offsetX: shadow.offsetX || 0,
        offsetY: shadow.offsetY || 0,
      };
    },

    changeOpacity: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ opacity: value });
      });
      canvas.renderAll();
      save();
    },

    alignLeft: () => {
      const objects = canvas.getActiveObjects();
      if (objects.length === 0) return;

      const workspace = getWorkspace();
      if (!workspace) return;

      if (objects.length === 1) {
        const obj = objects[0];
        obj.set({ left: workspace.left });
        obj.setCoords();
      } else {
        const activeSel = canvas.getActiveObject();
        if (!activeSel) return;
        const bound = activeSel.getBoundingRect(true, true);
        const targetLeft = bound.left;

        canvas.discardActiveObject();

        objects.forEach((obj) => {
          obj.set({ left: targetLeft });
          obj.setCoords();
        });

        const sel = new fabric.ActiveSelection(objects, { canvas: canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      save();
    },

    alignCenterX: () => {
      const objects = canvas.getActiveObjects();
      if (objects.length === 0) return;

      const workspace = getWorkspace();
      if (!workspace) return;

      if (objects.length === 1) {
        const obj = objects[0];
        const objWidth = (obj.width || 0) * (obj.scaleX || 1);
        obj.set({ left: (workspace.left || 0) + ((workspace.width || 0) - objWidth) / 2 });
        obj.setCoords();
      } else {
        const activeSel = canvas.getActiveObject();
        if (!activeSel) return;
        const bound = activeSel.getBoundingRect(true, true);
        const centerX = bound.left + bound.width / 2;

        canvas.discardActiveObject();

        objects.forEach((obj) => {
          const objWidth = (obj.width || 0) * (obj.scaleX || 1);
          obj.set({ left: centerX - objWidth / 2 });
          obj.setCoords();
        });

        const sel = new fabric.ActiveSelection(objects, { canvas: canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      save();
    },

    alignRight: () => {
      const objects = canvas.getActiveObjects();
      if (objects.length === 0) return;

      const workspace = getWorkspace();
      if (!workspace) return;

      if (objects.length === 1) {
        const obj = objects[0];
        const objWidth = (obj.width || 0) * (obj.scaleX || 1);
        obj.set({ left: (workspace.left || 0) + (workspace.width || 0) - objWidth });
        obj.setCoords();
      } else {
        const activeSel = canvas.getActiveObject();
        if (!activeSel) return;
        const bound = activeSel.getBoundingRect(true, true);
        const targetRight = bound.left + bound.width;

        canvas.discardActiveObject();

        objects.forEach((obj) => {
          const objWidth = (obj.width || 0) * (obj.scaleX || 1);
          obj.set({ left: targetRight - objWidth });
          obj.setCoords();
        });

        const sel = new fabric.ActiveSelection(objects, { canvas: canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      save();
    },

    alignTop: () => {
      const objects = canvas.getActiveObjects();
      if (objects.length === 0) return;

      const workspace = getWorkspace();
      if (!workspace) return;

      if (objects.length === 1) {
        const obj = objects[0];
        obj.set({ top: workspace.top });
        obj.setCoords();
      } else {
        const activeSel = canvas.getActiveObject();
        if (!activeSel) return;
        const bound = activeSel.getBoundingRect(true, true);
        const targetTop = bound.top;

        canvas.discardActiveObject();

        objects.forEach((obj) => {
          obj.set({ top: targetTop });
          obj.setCoords();
        });

        const sel = new fabric.ActiveSelection(objects, { canvas: canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      save();
    },

    alignCenterY: () => {
      const objects = canvas.getActiveObjects();
      if (objects.length === 0) return;

      const workspace = getWorkspace();
      if (!workspace) return;

      if (objects.length === 1) {
        const obj = objects[0];
        const objHeight = (obj.height || 0) * (obj.scaleY || 1);
        obj.set({ top: (workspace.top || 0) + ((workspace.height || 0) - objHeight) / 2 });
        obj.setCoords();
      } else {
        const activeSel = canvas.getActiveObject();
        if (!activeSel) return;
        const bound = activeSel.getBoundingRect(true, true);
        const centerY = bound.top + bound.height / 2;

        canvas.discardActiveObject();

        objects.forEach((obj) => {
          const objHeight = (obj.height || 0) * (obj.scaleY || 1);
          obj.set({ top: centerY - objHeight / 2 });
          obj.setCoords();
        });

        const sel = new fabric.ActiveSelection(objects, { canvas: canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      save();
    },

    alignBottom: () => {
      const objects = canvas.getActiveObjects();
      if (objects.length === 0) return;

      const workspace = getWorkspace();
      if (!workspace) return;

      if (objects.length === 1) {
        const obj = objects[0];
        const objHeight = (obj.height || 0) * (obj.scaleY || 1);
        obj.set({ top: (workspace.top || 0) + (workspace.height || 0) - objHeight });
        obj.setCoords();
      } else {
        const activeSel = canvas.getActiveObject();
        if (!activeSel) return;
        const bound = activeSel.getBoundingRect(true, true);
        const targetBottom = bound.top + bound.height;

        canvas.discardActiveObject();

        objects.forEach((obj) => {
          const objHeight = (obj.height || 0) * (obj.scaleY || 1);
          obj.set({ top: targetBottom - objHeight });
          obj.setCoords();
        });

        const sel = new fabric.ActiveSelection(objects, { canvas: canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      save();
    },

    bringForward: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.bringForward(object);
      });

      canvas.renderAll();

      const workspace = getWorkspace();
      workspace?.sendToBack();
      save();
    },
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });

      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
      save();
    },
    changeFontFamily: (value: string) => {
      setFontFamily(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontFamily exists.
          object.set({ fontFamily: value });
        }
      });
      canvas.renderAll();
      save();
    },

    changeFillGradient: (gradient: GradientOptions | null) => {
      canvas.getActiveObjects().forEach((object) => {
        if (gradient === null) {
          // Remove gradiente - volta pra cor solida (usa fillColor atual ou branco)
          object.set({ fill: fillColor || "#000000" });
        } else {
          // Calcula coords baseado no tipo e angulo
          const objWidth = (object.width || 0) * (object.scaleX || 1);
          const objHeight = (object.height || 0) * (object.scaleY || 1);

          let coords: any;

          if (gradient.type === "linear") {
            const rad = (gradient.angle * Math.PI) / 180;
            const cx = objWidth / 2;
            const cy = objHeight / 2;
            const dx = Math.cos(rad) * cx;
            const dy = Math.sin(rad) * cy;
            coords = {
              x1: cx - dx,
              y1: cy - dy,
              x2: cx + dx,
              y2: cy + dy,
            };
          } else {
            // radial: do centro pra fora
            coords = {
              x1: objWidth / 2,
              y1: objHeight / 2,
              r1: 0,
              x2: objWidth / 2,
              y2: objHeight / 2,
              r2: Math.max(objWidth, objHeight) / 2,
            };
          }

          const fabricGradient = new fabric.Gradient({
            type: gradient.type,
            coords: coords,
            colorStops: gradient.colorStops.map(function (stop) {
              return {
                offset: stop.offset,
                color: stop.color,
              };
            }),
          });

          object.set({ fill: fabricGradient as any });
        }
      });
      canvas.requestRenderAll();
      save();
    },

    getActiveFillGradient: (): GradientOptions | null => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return null;

      const fill = selectedObject.get("fill");
      if (!fill || typeof fill === "string") return null;

      // @ts-ignore - fabric.Gradient tem essas propriedades
      const grad = fill as fabric.Gradient;
      // @ts-ignore - colorStops existe
      const stops = grad.colorStops || [];

      // @ts-ignore - type existe
      const gradType = (grad.type as GradientType) || "linear";

      // Recupera angulo se for linear (aproximacao reversa)
      let angle = 90;
      // @ts-ignore - coords existe
      const coords = grad.coords as any;
      if (gradType === "linear" && coords) {
        const dx = (coords.x2 || 0) - (coords.x1 || 0);
        const dy = (coords.y2 || 0) - (coords.y1 || 0);
        angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      }

      return {
        type: gradType,
        angle: angle,
        colorStops: stops.map(function (s: any) {
          return {
            offset: s.offset || 0,
            color: s.color || "#000000",
          };
        }),
      };
    },  

    changeFillColor: (value: string) => {
      setFillColor(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ fill: value });
      });
      canvas.renderAll();
      save();
    },
    changeStrokeColor: (value: string) => {
      setStrokeColor(value);
      canvas.getActiveObjects().forEach((object) => {
        // Text types don't have stroke
        if (isTextType(object.type)) {
          object.set({ fill: value });
          return;
        }

        object.set({ stroke: value });
      });
      canvas.freeDrawingBrush.color = value;
      canvas.renderAll();
      save();
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeWidth: value });
      });
      canvas.freeDrawingBrush.width = value;
      canvas.renderAll();
      save();
    },
    changeStrokeDashArray: (value: number[]) => {
      setStrokeDashArray(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeDashArray: value });
      });
      canvas.renderAll();
      save();
    },
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      applyCornerRadiusControls(object);
      addToCanvas(object);
    },
    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addInverseTriangle: () => {
      const HEIGHT = TRIANGLE_OPTIONS.height;
      const WIDTH = TRIANGLE_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH / 2, y: HEIGHT },
        ],
        {
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addDiamond: () => {
      const HEIGHT = DIAMOND_OPTIONS.height;
      const WIDTH = DIAMOND_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: WIDTH / 2, y: 0 },
          { x: WIDTH, y: HEIGHT / 2 },
          { x: WIDTH / 2, y: HEIGHT },
          { x: 0, y: HEIGHT / 2 },
        ],
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      addToCanvas(object);
    },

    addStar: () => {
      const WIDTH = 200;
      const HEIGHT = 200;
      const spikes = 5;
      const outerRadius = WIDTH / 2;
      const innerRadius = WIDTH / 4;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const points: { x: number; y: number }[] = [];
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      for (let i = 0; i < spikes; i++) {
        points.push({
          x: cx + Math.cos(rot) * outerRadius,
          y: cy + Math.sin(rot) * outerRadius,
        });
        rot += step;
        points.push({
          x: cx + Math.cos(rot) * innerRadius,
          y: cy + Math.sin(rot) * innerRadius,
        });
        rot += step;
      }

      const object = new fabric.Polygon(points, {
        ...STAR_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addArrow: () => {
      const WIDTH = 250;
      const HEIGHT = 200;

      const object = new fabric.Polygon(
        [
          { x: 0, y: HEIGHT * 0.3 },
          { x: WIDTH * 0.6, y: HEIGHT * 0.3 },
          { x: WIDTH * 0.6, y: HEIGHT * 0.1 },
          { x: WIDTH, y: HEIGHT * 0.5 },
          { x: WIDTH * 0.6, y: HEIGHT * 0.9 },
          { x: WIDTH * 0.6, y: HEIGHT * 0.7 },
          { x: 0, y: HEIGHT * 0.7 },
        ],
        {
          ...ARROW_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addLine: () => {
      const object = new fabric.Line([0, 0, 300, 0], {
        ...LINE_OPTIONS,
        stroke: strokeColor,
        strokeWidth: strokeWidth > 0 ? strokeWidth : 4,
      });

      addToCanvas(object);
    },
    
    toggleEditable: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return;
      }

      // @ts-ignore - propriedade custom
      const current = selectedObject.get("isEditable") || false;
      const newValue = !current;

      canvas.getActiveObjects().forEach((object) => {
        // @ts-ignore - propriedade custom
        object.set({ isEditable: newValue });
      });

      canvas.requestRenderAll();
      save();
    },
    getActiveEditable: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return false;
      }

      // @ts-ignore - propriedade custom
      const value = selectedObject.get("isEditable") || false;

      return value;
    },
    canvas,
    getActiveFontWeight: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return FONT_WEIGHT;
      }

      // @ts-ignore
      // Faulty TS library, fontWeight exists.
      const value = selectedObject.get("fontWeight") || FONT_WEIGHT;

      return value;
    },
    getActiveFontFamily: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return fontFamily;
      }

      // @ts-ignore
      // Faulty TS library, fontFamily exists.
      const value = selectedObject.get("fontFamily") || fontFamily;

      return value;
    },
    getActiveFillColor: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return fillColor;
      }

      const value = selectedObject.get("fill") || fillColor;

      // Currently, gradients & patterns are not supported
      return value as string;
    },
    getActiveStrokeColor: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return strokeColor;
      }

      const value = selectedObject.get("stroke") || strokeColor;

      return value;
    },
    getActiveStrokeWidth: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return strokeWidth;
      }

      const value = selectedObject.get("strokeWidth") || strokeWidth;

      return value;
    },
    getActiveStrokeDashArray: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return strokeDashArray;
      }

      const value = selectedObject.get("strokeDashArray") || strokeDashArray;

      return value;
    },
    selectedObjects,
  };
};

export const useEditor = ({
  defaultState,
  defaultHeight,
  defaultWidth,
  clearSelectionCallback,
  saveCallback,
}: EditorHookProps) => {
  const initialState = useRef(defaultState);
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

  useWindowEvents();

  const {
    save,
    canRedo,
    canUndo,
    undo,
    redo,
    canvasHistory,
    setHistoryIndex,
  } = useHistory({
    canvas,
    saveCallback
  });

  const { copy, paste } = useClipboard({ canvas });

  const { autoZoom } = useAutoResize({
    canvas,
    container,
  });

  useCanvasEvents({
    save,
    canvas,
    setSelectedObjects,
    clearSelectionCallback,
  });

  useHotkeys({
    undo,
    redo,
    copy,
    paste,
    save,
    canvas,
  });

  useLoadState({
    canvas,
    autoZoom,
    initialState,
    canvasHistory,
    setHistoryIndex,
  });

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({
        save,
        undo,
        redo,
        canUndo,
        canRedo,
        autoZoom,
        copy,
        paste,
        canvas,
        fillColor,
        strokeWidth,
        strokeColor,
        setFillColor,
        setStrokeColor,
        setStrokeWidth,
        strokeDashArray,
        selectedObjects,
        setStrokeDashArray,
        fontFamily,
        setFontFamily,
      });
    }

    return undefined;
  },
  [
    canRedo,
    canUndo,
    undo,
    redo,
    save,
    autoZoom,
    copy,
    paste,
    canvas,
    fillColor,
    strokeWidth,
    strokeColor,
    selectedObjects,
    strokeDashArray,
    fontFamily,
  ]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: initialWidth.current,
        height: initialHeight.current,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.8)",
          blur: 5,
        }),
      });

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      const currentState = JSON.stringify(
        initialCanvas.toJSON(JSON_KEYS)
      );
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
    },
    [
      canvasHistory,
      setHistoryIndex,
    ]
  );

  return { init, editor };
};