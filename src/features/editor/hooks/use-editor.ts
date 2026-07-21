import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef } from "react";
import { jsPDF } from "jspdf";
import {
  applyCornerRadiusControls,
  updateRadiusHandleOffsets,
} from "@/features/editor/utils/rect-controls";

import { toast } from "sonner";

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
import {
  migrateToV2,
  getFirstPageId,
  setPageJson,
  serializeDocument,
  type EditorDocumentV2,
} from "@/features/editor/utils/pages";
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
  documentRef,
  activePageIdRef,
  setPages,
  setActivePageId,
  pageThumbsRef,
  setThumbsVersion,
  isExportingRef,
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
    const workspace = getWorkspace() as fabric.Rect | undefined;

    const width = workspace?.width ?? 1080;
    const height = workspace?.height ?? 1080;
    const left = workspace?.left ?? 0;
    const top = workspace?.top ?? 0;

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

  // Renderiza uma pagina especifica e devolve o dataUrl da imagem.
  // Assincrono: espera as imagens da pagina carregarem antes de fotografar.
  const renderPageToDataUrl = (
    pageJson: any,
    format: "png" | "jpeg",
    multiplier: number = 1
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      canvas.loadFromJSON(pageJson || {}, () => {
        setTimeout(() => {
          try {
            const workspace = canvas
              .getObjects()
              .find((o: any) => o.name === "clip");
            if (!workspace) {
              resolve(null);
              return;
            }

            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

            const wsWidth = (workspace as any).width || 1080;
            const wsHeight = (workspace as any).height || 1080;

            const dataUrl = canvas.toDataURL({
              format: format,
              quality: 1,
              // @ts-ignore
              width: wsWidth,
              height: wsHeight,
              left: (workspace as any).left,
              top: (workspace as any).top,
              multiplier: multiplier,
            });

            resolve(dataUrl);
          } catch {
            resolve(null);
          }
        }, 150);
      });
    });
  };

  // Sincroniza a pagina atual e devolve a lista de paginas do documento.
  // Usado pelos exports pra iterar todas as paginas.
  const getAllPagesForExport = () => {
    const currentJson = canvas.toJSON(JSON_KEYS);
    const synced = documentRef.current.pages.map((p: any) =>
      p.id === activePageIdRef.current ? { ...p, json: currentJson } : p
    );
    documentRef.current = { ...documentRef.current, pages: synced };
    return documentRef.current.pages;
  };

  // Volta pra pagina onde o usuario estava (chamado no fim dos exports)
  const restoreActivePage = (pageId: string) => {
    const page = documentRef.current.pages.find((p: any) => p.id === pageId);
    if (page) {
      canvas.loadFromJSON(page.json || {}, () => {
        autoZoom();
      });
    }
  };

  const savePng = async () => {
    const pages = getAllPagesForExport();
    const activeId = activePageIdRef.current;

    // Uma pagina so: comportamento simples
    if (pages.length <= 1) {
      const options = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(options);
      downloadFile(dataUrl, "png");
      autoZoom();
      return;
    }

    // Multipagina: baixa cada pagina como arquivo separado
    isExportingRef.current = true;
    for (let i = 0; i < pages.length; i++) {
      const dataUrl = await renderPageToDataUrl(pages[i].json, "png", 1);
      if (dataUrl) {
        downloadFile(dataUrl, "png");
      }
    }

    restoreActivePage(activeId);
    // Libera o autosave so depois do canvas voltar pra pagina certa
    setTimeout(() => {
      isExportingRef.current = false;
    }, 300);
  };

  const savePdf = async (dpi: "screen" | "print" = "screen") => {
    const workspace = getWorkspace() as fabric.Rect | undefined;
    const width = workspace?.width || 1080;
    const height = workspace?.height || 1080;
    const multiplier = dpi === "print" ? 4 : 1;

    const pages = getAllPagesForExport();
    const activeId = activePageIdRef.current;

    const orientation = width > height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "px",
      format: [width, height],
    });

    // Uma pagina so
    if (pages.length <= 1) {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL({
        width: width,
        height: height,
        left: workspace?.left ?? 0,
        top: workspace?.top ?? 0,
        format: "jpeg",
        quality: 1,
        multiplier: multiplier,
      });
      pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
      pdf.save("artbase-export.pdf");
      autoZoom();
      return;
    }

    // Multipagina: uma pagina do PDF por slide
    isExportingRef.current = true;
    for (let i = 0; i < pages.length; i++) {
      const dataUrl = await renderPageToDataUrl(pages[i].json, "jpeg", multiplier);
      if (dataUrl) {
        if (i > 0) {
          pdf.addPage([width, height], orientation);
        }
        pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
      }
    }

    pdf.save("artbase-export.pdf");
    restoreActivePage(activeId);
    setTimeout(() => {
      isExportingRef.current = false;
    }, 300);
  };
  
  const generateThumbnail = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // Limita o thumbnail a 800px na maior dimensao pra evitar
    // arquivos grandes que estouram o limite de upload (2MB)
    const MAX_THUMB_DIMENSION = 800;
    const workspace = getWorkspace() as fabric.Rect | undefined;
    const wsWidth = workspace?.width || 1080;
    const wsHeight = workspace?.height || 1080;
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

  const saveJpg = async () => {
    const pages = getAllPagesForExport();
    const activeId = activePageIdRef.current;

    if (pages.length <= 1) {
      const options = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(options);
      downloadFile(dataUrl, "jpg");
      autoZoom();
      return;
    }

    isExportingRef.current = true;
    for (let i = 0; i < pages.length; i++) {
      const dataUrl = await renderPageToDataUrl(pages[i].json, "jpeg", 1);
      if (dataUrl) {
        downloadFile(dataUrl, "jpg");
      }
    }

    restoreActivePage(activeId);
    setTimeout(() => {
      isExportingRef.current = false;
    }, 300);
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

  const captureActiveThumb = () => {
    try {
      const workspace = canvas
        .getObjects()
        .find((o: any) => o.name === "clip");
      if (!workspace) return;

      const prevTransform = canvas.viewportTransform
        ? [...canvas.viewportTransform]
        : null;

      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      const wsWidth = (workspace as any).width || 1080;
      const wsHeight = (workspace as any).height || 1080;
      const larger = Math.max(wsWidth, wsHeight);
      const THUMB_SIZE = 140;
      const multiplier = larger > 0 ? THUMB_SIZE / larger : 0.1;

      const dataUrl = canvas.toDataURL({
        format: "jpeg",
        quality: 0.6,
        // @ts-ignore
        width: wsWidth,
        height: wsHeight,
        left: (workspace as any).left,
        top: (workspace as any).top,
        multiplier: multiplier,
      });

      pageThumbsRef.current[activePageIdRef.current] = dataUrl;
      setThumbsVersion((v) => v + 1);

      if (prevTransform) {
        canvas.setViewportTransform(prevTransform as any);
      } else {
        autoZoom();
      }
    } catch {
      // Se falhar, ignora - miniatura fica com numero
    }
  };

  return {
    // ===== MULTIPAGINA (Slides 2) =====
    getPages: () => {
      return documentRef.current.pages.map((p: any) => ({ id: p.id }));
    },
    getActivePageId: () => {
      return activePageIdRef.current;
    },
    getPageThumb: (pageId: string) => {
      return pageThumbsRef.current[pageId] || null;
    },

    // Gera thumbnail da PAGINA 1 (capa do projeto), em alta qualidade.
    // Assincrono: espera as imagens da pagina 1 carregarem antes de fotografar.
    generateCoverThumbnail: (): Promise<string | undefined> => {
      return new Promise((resolve) => {
        try {
          const doc = documentRef.current;
          const firstPage = doc.pages[0];
          if (!firstPage) {
            resolve(undefined);
            return;
          }

          // Suspende o autosave durante a captura (evita contaminar paginas)
          isExportingRef.current = true;

          const currentActiveId = activePageIdRef.current;

          // Sincroniza a pagina atual antes de sair dela (regra de ouro)
          const currentJson = canvas.toJSON(JSON_KEYS);
          const synced = doc.pages.map((p: any) =>
            p.id === currentActiveId ? { ...p, json: currentJson } : p
          );
          documentRef.current = { ...doc, pages: synced };

          const firstPageJson =
            documentRef.current.pages[0].json || {};

          // Ja estamos na pagina 1? Fotografa direto, sem trocar.
          const alreadyOnFirst = currentActiveId === documentRef.current.pages[0].id;

          // Reativa o autosave (com pequeno atraso pra garantir que o
          // canvas ja voltou pra pagina certa antes de liberar o save)
          const releaseFlag = () => {
            setTimeout(() => {
              isExportingRef.current = false;
            }, 300);
          };

          const shoot = () => {
            const workspace = canvas
              .getObjects()
              .find((o: any) => o.name === "clip");
            if (!workspace) {
              resolve(undefined);
              return;
            }

            const prevTransform = canvas.viewportTransform
              ? [...canvas.viewportTransform]
              : null;

            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

            const wsWidth = (workspace as any).width || 1080;
            const wsHeight = (workspace as any).height || 1080;
            const larger = Math.max(wsWidth, wsHeight);
            const MAX = 800;
            const multiplier = larger > MAX ? MAX / larger : 1;

            const dataUrl = canvas.toDataURL({
              format: "png",
              quality: 1,
              // @ts-ignore
              width: wsWidth,
              height: wsHeight,
              left: (workspace as any).left,
              top: (workspace as any).top,
              multiplier: multiplier,
            });

            if (prevTransform) {
              canvas.setViewportTransform(prevTransform as any);
            }

            resolve(dataUrl);
          };

          if (alreadyOnFirst) {
            // Ja esta na pagina 1: fotografa direto
            shoot();
            releaseFlag();
          } else {
            // Carrega a pagina 1, espera renderizar, fotografa, volta
            canvas.loadFromJSON(firstPageJson, () => {
              // Pequeno atraso pra garantir que imagens externas renderizaram
              setTimeout(() => {
                shoot();

                // Volta pra pagina onde o usuario estava
                const backPage = documentRef.current.pages.find(
                  (p: any) => p.id === currentActiveId
                );
                if (backPage) {
                  canvas.loadFromJSON(backPage.json || {}, () => {
                    autoZoom();
                    releaseFlag();
                  });
                } else {
                  releaseFlag();
                }
              }, 150);
            });
          }
        } catch {
          isExportingRef.current = false;
          resolve(undefined);
        }
      });
    },
    
    // Sincroniza o canvas atual no documento (regra de ouro - Opcao 1)
    syncActivePage: () => {
      const currentJson = canvas.toJSON(JSON_KEYS);
      const pages = documentRef.current.pages.map((p: any) =>
        p.id === activePageIdRef.current ? { ...p, json: currentJson } : p
      );
      documentRef.current = { ...documentRef.current, pages };
    },
    goToPage: (pageId: string) => {
      if (pageId === activePageIdRef.current) return;

      // 1. Salva o canvas atual no slot da pagina que sai (regra de ouro)
      captureActiveThumb();
      const currentJson = canvas.toJSON(JSON_KEYS);
      const syncedPages = documentRef.current.pages.map((p: any) =>
        p.id === activePageIdRef.current ? { ...p, json: currentJson } : p
      );
      documentRef.current = { ...documentRef.current, pages: syncedPages };

      // 2. Acha a pagina que entra
      const target = documentRef.current.pages.find(
        (p: any) => p.id === pageId
      );
      if (!target) return;

      // 3. Troca a pagina ativa
      activePageIdRef.current = pageId;
      setActivePageId(pageId);

      // 4. Carrega o json da pagina que entra no canvas
      canvas.loadFromJSON(target.json || {}, () => {
        autoZoom();
        save();
      });
    },
    addPage: () => {
      // 1. Salva a pagina atual antes de criar a nova
      captureActiveThumb();
      const currentJson = canvas.toJSON(JSON_KEYS);
      const syncedPages = documentRef.current.pages.map((p: any) =>
        p.id === activePageIdRef.current ? { ...p, json: currentJson } : p
      );

      // 2. Cria a pagina nova (vazia - so o workspace sera criado ao carregar)
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `page-${Date.now()}`;

      // A pagina nova comeca com o mesmo workspace (mesa branca) da atual,
      // mas sem os outros objetos. Pega o clip atual como base.
      const clip = canvas
        .getObjects()
        .find((o: any) => o.name === "clip");
      const emptyPageJson = clip
        ? { version: "5.3.0", objects: [clip.toObject(JSON_KEYS)] }
        : {};

      const newPage = { id: newId, json: emptyPageJson };
      const newPages = [...syncedPages, newPage];
      documentRef.current = { ...documentRef.current, pages: newPages };

      // 3. Atualiza estado da UI
      setPages(newPages.map((p: any) => ({ id: p.id })));

      // 4. Vai pra pagina nova
      activePageIdRef.current = newId;
      setActivePageId(newId);
      canvas.loadFromJSON(emptyPageJson, () => {
        autoZoom();
        save();
      });
    },

    duplicatePage: (pageId: string) => {
      // Sincroniza a pagina atual antes de mexer
      captureActiveThumb();
      const currentJson = canvas.toJSON(JSON_KEYS);
      const syncedPages = documentRef.current.pages.map((p: any) =>
        p.id === activePageIdRef.current ? { ...p, json: currentJson } : p
      );

      // Acha a pagina a duplicar
      const sourceIndex = syncedPages.findIndex((p: any) => p.id === pageId);
      if (sourceIndex === -1) return;

      const source = syncedPages[sourceIndex];

      // Cria copia com id novo
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `page-${Date.now()}`;

      const copy = {
        id: newId,
        json: JSON.parse(JSON.stringify(source.json || {})),
      };

      // Insere logo depois da original
      const newPages = [
        ...syncedPages.slice(0, sourceIndex + 1),
        copy,
        ...syncedPages.slice(sourceIndex + 1),
      ];

      documentRef.current = { ...documentRef.current, pages: newPages };
      setPages(newPages.map((p: any) => ({ id: p.id })));

      // Vai pra copia
      activePageIdRef.current = newId;
      setActivePageId(newId);
      canvas.loadFromJSON(copy.json, () => {
        autoZoom();
        save();
      });
    },
    deletePage: (pageId: string) => {
      // Nunca deleta a ultima pagina
      if (documentRef.current.pages.length <= 1) return;

      const pages = documentRef.current.pages;
      const index = pages.findIndex((p: any) => p.id === pageId);
      if (index === -1) return;

      const newPages = pages.filter((p: any) => p.id !== pageId);
      documentRef.current = { ...documentRef.current, pages: newPages };
      setPages(newPages.map((p: any) => ({ id: p.id })));

      // Se deletou a pagina ativa, vai pra vizinha
      if (pageId === activePageIdRef.current) {
        const newActive = newPages[Math.max(0, index - 1)];
        activePageIdRef.current = newActive.id;
        setActivePageId(newActive.id);
        canvas.loadFromJSON(newActive.json || {}, () => {
          autoZoom();
          save();
        });
      } else {
        // So persiste a remocao
        save();
      }
    },
    movePage: (pageId: string, direction: "left" | "right") => {
      // Sincroniza a pagina atual antes de reordenar
      captureActiveThumb();
      const currentJson = canvas.toJSON(JSON_KEYS);
      const syncedPages = documentRef.current.pages.map((p: any) =>
        p.id === activePageIdRef.current ? { ...p, json: currentJson } : p
      );

      const index = syncedPages.findIndex((p: any) => p.id === pageId);
      if (index === -1) return;

      const target = direction === "left" ? index - 1 : index + 1;
      // Fora dos limites: nao faz nada
      if (target < 0 || target >= syncedPages.length) return;

      // Troca as posicoes
      const newPages = [...syncedPages];
      const tmp = newPages[index];
      newPages[index] = newPages[target];
      newPages[target] = tmp;

      documentRef.current = { ...documentRef.current, pages: newPages };
      setPages(newPages.map((p: any) => ({ id: p.id })));
      save();
    },

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

    addSvg: (value: string) => {
      fabric.loadSVGFromURL(
        value,
        (objects, options) => {
          // Funde todos os paths num objeto unico (nao vira group).
          // Assim os controles de cor/gradiente/stroke funcionam igual
          // aos icones de 1 path.
          objects.forEach((o: any) => {
            if (!o.fill || o.fill === "") {
              o.set({ fill: "#000000" });
            }
          });

          const obj =
            objects.length > 1
              ? new fabric.Group(objects, options)
              : objects[0];

          const workspace = getWorkspace();
          const maxWidth = (workspace?.width || 400) * 0.75;

          obj.scaleToWidth(maxWidth);

          addToCanvas(obj);
        },
        undefined,
        {
          crossOrigin: "anonymous",
        } as any,
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
      // Vetores de multiplas partes (group) nao suportam gradiente.
      const hasGroup = canvas
        .getActiveObjects()
        .some((object) => (object as any).forEachObject);

      if (hasGroup && gradient !== null) {
        toast.error(
          "Gradiente nao disponivel neste vetor. Ele tem varias partes; use cor unica ou stroke."
        );
        return;
      }

      canvas.getActiveObjects().forEach((object) => {
        if (gradient === null) {
          object.set({ fill: fillColor || "#000000" });
        } else {
          // Dimensoes reais (sem escala - o gradiente e em coords locais do objeto)
          const objWidth = object.width || 0;
          const objHeight = object.height || 0;

          // Centro real do objeto em coords locais.
          // Polygons/Paths tem pathOffset que desloca a origem;
          // pra esses, o centro e o proprio pathOffset.
          const po = (object as any).pathOffset;
          const cx = po && typeof po.x === "number" ? po.x : objWidth / 2;
          const cy = po && typeof po.y === "number" ? po.y : objHeight / 2;

          let coords: any;

          if (gradient.type === "linear") {
            const rad = (gradient.angle * Math.PI) / 180;
            const dx = Math.cos(rad) * (objWidth / 2);
            const dy = Math.sin(rad) * (objHeight / 2);
            coords = {
              x1: cx - dx,
              y1: cy - dy,
              x2: cx + dx,
              y2: cy + dy,
            };
          } else {
            // radial: do centro real pra fora
            coords = {
              x1: cx,
              y1: cy,
              r1: 0,
              x2: cx,
              y2: cy,
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
        if ((object as any).forEachObject) {
          (object as any).forEachObject((child: any) => {
            child.set({ fill: value });
          });
        } else {
          object.set({ fill: value });
        }
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

        if ((object as any).forEachObject) {
          (object as any).forEachObject((child: any) => {
            child.set({ stroke: value });
          });
        } else {
          object.set({ stroke: value });
        }
      });
      canvas.freeDrawingBrush.color = value;
      canvas.renderAll();
      save();
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((object) => {
        if ((object as any).forEachObject) {
          (object as any).forEachObject((child: any) => {
            child.set({ strokeWidth: value });
          });
        } else {
          object.set({ strokeWidth: value });
        }
      });
      canvas.freeDrawingBrush.width = value;
      canvas.renderAll();
      save();
    },
    changeStrokeDashArray: (value: number[]) => {
      setStrokeDashArray(value);
      canvas.getActiveObjects().forEach((object) => {
        if ((object as any).forEachObject) {
          (object as any).forEachObject((child: any) => {
            child.set({ strokeDashArray: value });
          });
        } else {
          object.set({ strokeDashArray: value });
        }
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
      const object = new fabric.Path(
        "M918.62,336.23c0,3.16-1.15,5.34-3.34,6.62l-268.43,195.4c-2.55,1.58-3.76,3.95-3.76,7.1,0,.67,1.34,5.34,4.01,14.02,2.67,8.68,6.31,20.03,10.93,34.11,4.55,14.08,9.77,30.11,15.66,48.14,5.83,18.03,11.9,36.54,18.27,55.48,6.31,19,12.44,37.82,18.45,56.45,6.01,18.64,11.53,35.63,16.63,50.99,5.04,15.3,9.29,28.29,12.81,38.85,3.46,10.62,5.65,17.36,6.62,20.21.3.61.49,1.52.49,2.79,0,2.25-.91,4.13-2.61,5.71-1.76,1.58-3.76,2.37-5.95,2.37s-3.95-.49-5.22-1.4l-10.87-8.07c-6.68-4.73-15.42-11.17-26.35-19.18-10.93-8.07-23.01-17.06-36.3-26.83-13.23-9.77-27.32-20.09-42.19-30.84-14.87-10.74-29.56-21.43-44.07-31.99-14.57-10.56-28.47-20.7-41.76-30.35-13.29-9.65-25.13-18.15-35.57-25.62-10.44-7.4-18.88-13.29-25.37-17.54-6.49-4.25-10.2-6.37-11.11-6.37-1.64,0-3.34.61-5.22,1.88l-268.43,194.92c-1.64.91-3.34,1.4-5.22,1.4-2.25,0-4.25-.79-5.95-2.37-1.76-1.58-2.61-3.46-2.61-5.71,0-.3,1.34-4.92,4.07-13.72,2.61-8.86,6.31-20.34,10.87-34.42,4.55-14.08,9.77-30.11,15.66-48.14,5.83-17.97,11.84-36.6,18.03-55.73,6.13-19.06,12.32-37.94,18.51-56.39,6.13-18.52,11.66-35.51,16.57-50.99,4.92-15.48,9.04-28.53,12.57-39.15,3.46-10.56,5.71-17.3,6.62-20.15.3-.61.49-1.58.49-2.79,0-2.85-1.09-5.1-3.28-6.68L3.34,342.85c-2.25-1.58-3.34-3.76-3.34-6.62,0-2.55.79-4.61,2.37-6.19,1.58-1.52,3.64-2.37,6.19-2.37h331.98c3.76,0,6.43-2,8.01-6.13L451.51,5.71c.91-3.83,3.58-5.71,8.07-5.71s7.1,1.88,8.01,5.71l102.47,315.84c1.21,4.13,3.95,6.13,8.07,6.13h332.41c2.55,0,4.49.85,5.95,2.37,1.4,1.58,2.12,3.64,2.12,6.19",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },

    addStar8: () => {
      // Pontos EXATOS do SVG (viewBox 0 0 1395.74 1395.74), sem conversao
      const points = [
        { x: 1395.74, y: 697.87 },
        { x: 1101.13, y: 530.83 },
        { x: 1191.34, y: 204.4 },
        { x: 864.91, y: 294.61 },
        { x: 697.87, y: 0 },
        { x: 530.83, y: 294.61 },
        { x: 204.4, y: 204.4 },
        { x: 294.61, y: 530.83 },
        { x: 0, y: 697.87 },
        { x: 294.61, y: 864.91 },
        { x: 204.4, y: 1191.34 },
        { x: 530.83, y: 1101.13 },
        { x: 697.87, y: 1395.74 },
        { x: 864.91, y: 1101.13 },
        { x: 1191.34, y: 1191.34 },
        { x: 1101.13, y: 864.91 },
      ];

      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      // Escala a forma pra ~200px (o Fabric cuida do resto)
      object.scaleToWidth(200);

      addToCanvas(object);
    },

    addStar20: () => {
      const points = [
        { x: 179.64, y: 112.61 },
        { x: 200.0, y: 100.0 },
        { x: 179.64, y: 87.39 },
        { x: 195.11, y: 69.1 },
        { x: 171.84, y: 63.39 },
        { x: 180.9, y: 41.22 },
        { x: 157.02, y: 42.98 },
        { x: 158.78, y: 19.1 },
        { x: 136.61, y: 28.16 },
        { x: 130.9, y: 4.89 },
        { x: 112.61, y: 20.36 },
        { x: 100.0, y: 0.0 },
        { x: 87.39, y: 20.36 },
        { x: 69.1, y: 4.89 },
        { x: 63.39, y: 28.16 },
        { x: 41.22, y: 19.1 },
        { x: 42.98, y: 42.98 },
        { x: 19.1, y: 41.22 },
        { x: 28.16, y: 63.39 },
        { x: 4.89, y: 69.1 },
        { x: 20.36, y: 87.39 },
        { x: 0.0, y: 100.0 },
        { x: 20.36, y: 112.61 },
        { x: 4.89, y: 130.9 },
        { x: 28.16, y: 136.61 },
        { x: 19.1, y: 158.78 },
        { x: 42.98, y: 157.02 },
        { x: 41.22, y: 180.9 },
        { x: 63.39, y: 171.84 },
        { x: 69.1, y: 195.11 },
        { x: 87.39, y: 179.64 },
        { x: 100.0, y: 200.0 },
        { x: 112.61, y: 179.64 },
        { x: 130.9, y: 195.11 },
        { x: 136.61, y: 171.84 },
        { x: 158.78, y: 180.9 },
        { x: 157.02, y: 157.02 },
        { x: 180.9, y: 158.78 },
        { x: 171.84, y: 136.61 },
        { x: 195.11, y: 130.9 },
        { x: 179.64, y: 112.61 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },

    addStar4: () => {
      const points = [
        { x: 127.03, y: 73.0 },
        { x: 100.0, y: 0.0 },
        { x: 73.0, y: 73.0 },
        { x: 0.0, y: 100.0 },
        { x: 73.0, y: 127.03 },
        { x: 100.0, y: 200.0 },
        { x: 127.03, y: 127.03 },
        { x: 200.0, y: 100.0 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },

    addStar40: () => {
      const points = [
        { x: 184.55, y: 106.68 }, { x: 200.0, y: 100.0 }, { x: 184.55, y: 93.32 },
        { x: 198.77, y: 84.34 }, { x: 182.45, y: 80.19 }, { x: 195.09, y: 69.08 },
        { x: 178.34, y: 67.53 }, { x: 189.09, y: 54.6 }, { x: 172.3, y: 55.69 },
        { x: 180.9, y: 41.22 }, { x: 164.48, y: 44.93 }, { x: 170.71, y: 29.29 },
        { x: 155.09, y: 35.52 }, { x: 158.79, y: 19.1 }, { x: 144.32, y: 27.7 },
        { x: 145.41, y: 10.9 }, { x: 132.48, y: 21.66 }, { x: 130.93, y: 4.9 },
        { x: 119.81, y: 17.54 }, { x: 115.66, y: 1.23 }, { x: 106.68, y: 15.45 },
        { x: 100.0, y: 0.0 }, { x: 93.32, y: 15.45 }, { x: 84.34, y: 1.23 },
        { x: 80.19, y: 17.54 }, { x: 69.08, y: 4.9 }, { x: 67.53, y: 21.66 },
        { x: 54.6, y: 10.9 }, { x: 55.69, y: 27.7 }, { x: 41.22, y: 19.1 },
        { x: 44.93, y: 35.52 }, { x: 29.29, y: 29.29 }, { x: 35.52, y: 44.93 },
        { x: 19.1, y: 41.22 }, { x: 27.7, y: 55.69 }, { x: 10.9, y: 54.6 },
        { x: 21.66, y: 67.53 }, { x: 4.9, y: 69.08 }, { x: 17.54, y: 80.19 },
        { x: 1.23, y: 84.34 }, { x: 15.45, y: 93.32 }, { x: 0.0, y: 100.0 },
        { x: 15.45, y: 106.68 }, { x: 1.23, y: 115.66 }, { x: 17.54, y: 119.81 },
        { x: 4.9, y: 130.93 }, { x: 21.66, y: 132.48 }, { x: 10.9, y: 145.41 },
        { x: 27.7, y: 144.32 }, { x: 19.1, y: 158.79 }, { x: 35.52, y: 155.09 },
        { x: 29.29, y: 170.71 }, { x: 44.93, y: 164.48 }, { x: 41.22, y: 180.9 },
        { x: 55.69, y: 172.3 }, { x: 54.6, y: 189.1 }, { x: 67.53, y: 178.34 },
        { x: 69.08, y: 195.1 }, { x: 80.19, y: 182.46 }, { x: 84.34, y: 198.77 },
        { x: 93.32, y: 184.55 }, { x: 100.0, y: 200.0 }, { x: 106.68, y: 184.55 },
        { x: 115.66, y: 198.77 }, { x: 119.81, y: 182.46 }, { x: 130.93, y: 195.1 },
        { x: 132.48, y: 178.34 }, { x: 145.41, y: 189.1 }, { x: 144.32, y: 172.3 },
        { x: 158.79, y: 180.9 }, { x: 155.09, y: 164.48 }, { x: 170.71, y: 170.71 },
        { x: 164.48, y: 155.09 }, { x: 180.9, y: 158.79 }, { x: 172.3, y: 144.32 },
        { x: 189.09, y: 145.41 }, { x: 178.34, y: 132.48 }, { x: 195.09, y: 130.93 },
        { x: 182.45, y: 119.81 }, { x: 198.77, y: 115.66 }, { x: 184.55, y: 106.68 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS, fill: fillColor, stroke: strokeColor,
        strokeWidth: strokeWidth, strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addAsterisk8: () => {
      const points = [
        { x: 200.0, y: 87.28 }, { x: 130.76, y: 87.28 }, { x: 179.74, y: 38.3 },
        { x: 161.72, y: 20.29 }, { x: 112.74, y: 69.26 }, { x: 112.74, y: 0.0 },
        { x: 87.28, y: 0.0 }, { x: 87.28, y: 69.26 }, { x: 38.3, y: 20.29 },
        { x: 20.29, y: 38.3 }, { x: 69.26, y: 87.28 }, { x: 0.0, y: 87.28 },
        { x: 0.0, y: 112.74 }, { x: 69.26, y: 112.74 }, { x: 20.29, y: 161.72 },
        { x: 38.3, y: 179.74 }, { x: 87.28, y: 130.76 }, { x: 87.28, y: 200.0 },
        { x: 112.74, y: 200.0 }, { x: 112.74, y: 130.76 }, { x: 161.72, y: 179.74 },
        { x: 179.74, y: 161.72 }, { x: 130.76, y: 112.74 }, { x: 200.0, y: 112.74 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS, fill: fillColor, stroke: strokeColor,
        strokeWidth: strokeWidth, strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addAsterisk12: () => {
      const points = [
        { x: 200.0, y: 87.28 }, { x: 147.51, y: 87.28 }, { x: 192.96, y: 61.03 },
        { x: 180.23, y: 38.97 }, { x: 134.79, y: 65.22 }, { x: 161.03, y: 19.77 },
        { x: 138.98, y: 7.03 }, { x: 112.74, y: 52.48 }, { x: 112.74, y: 0.0 },
        { x: 87.28, y: 0.0 }, { x: 87.28, y: 52.48 }, { x: 61.03, y: 7.03 },
        { x: 38.97, y: 19.77 }, { x: 65.22, y: 65.22 }, { x: 19.77, y: 38.97 },
        { x: 7.03, y: 61.03 }, { x: 52.48, y: 87.28 }, { x: 0.0, y: 87.28 },
        { x: 0.0, y: 112.74 }, { x: 52.48, y: 112.74 }, { x: 7.03, y: 138.98 },
        { x: 19.77, y: 161.03 }, { x: 65.22, y: 134.79 }, { x: 38.97, y: 180.23 },
        { x: 61.03, y: 192.96 }, { x: 87.28, y: 147.51 }, { x: 87.28, y: 200.0 },
        { x: 112.74, y: 200.0 }, { x: 112.74, y: 147.51 }, { x: 138.98, y: 192.96 },
        { x: 161.03, y: 180.23 }, { x: 134.79, y: 134.79 }, { x: 180.23, y: 161.03 },
        { x: 192.96, y: 138.98 }, { x: 147.51, y: 112.74 }, { x: 200.0, y: 112.74 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS, fill: fillColor, stroke: strokeColor,
        strokeWidth: strokeWidth, strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addAsterisk16: () => {
      const points = [
        { x: 200.0, y: 87.28 }, { x: 164.04, y: 87.28 }, { x: 197.27, y: 73.52 },
        { x: 187.52, y: 49.99 }, { x: 154.28, y: 63.75 }, { x: 179.71, y: 38.32 },
        { x: 161.68, y: 20.29 }, { x: 136.25, y: 45.72 }, { x: 150.01, y: 12.48 },
        { x: 126.48, y: 2.74 }, { x: 112.72, y: 35.96 }, { x: 112.72, y: 0.0 },
        { x: 87.28, y: 0.0 }, { x: 87.28, y: 35.96 }, { x: 73.52, y: 2.74 },
        { x: 49.99, y: 12.48 }, { x: 63.75, y: 45.72 }, { x: 38.32, y: 20.29 },
        { x: 20.29, y: 38.32 }, { x: 45.72, y: 63.75 }, { x: 12.48, y: 49.99 },
        { x: 2.74, y: 73.52 }, { x: 35.96, y: 87.28 }, { x: 0.0, y: 87.28 },
        { x: 0.0, y: 112.72 }, { x: 35.96, y: 112.72 }, { x: 2.74, y: 126.48 },
        { x: 12.48, y: 150.01 }, { x: 45.72, y: 136.25 }, { x: 20.29, y: 161.68 },
        { x: 38.32, y: 179.71 }, { x: 63.75, y: 154.28 }, { x: 49.99, y: 187.52 },
        { x: 73.52, y: 197.27 }, { x: 87.28, y: 164.04 }, { x: 87.28, y: 200.0 },
        { x: 112.72, y: 200.0 }, { x: 112.72, y: 164.04 }, { x: 126.48, y: 197.27 },
        { x: 150.01, y: 187.52 }, { x: 136.25, y: 154.28 }, { x: 161.68, y: 179.71 },
        { x: 179.71, y: 161.68 }, { x: 154.28, y: 136.25 }, { x: 187.52, y: 150.01 },
        { x: 197.27, y: 126.48 }, { x: 164.04, y: 112.72 }, { x: 200.0, y: 112.72 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS, fill: fillColor, stroke: strokeColor,
        strokeWidth: strokeWidth, strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addAsterisk8thin: () => {
      const points = [
        { x: 200.0, y: 97.65 }, { x: 105.71, y: 97.65 }, { x: 172.4, y: 30.96 },
        { x: 169.06, y: 27.62 }, { x: 102.37, y: 94.31 }, { x: 102.37, y: 0.0 },
        { x: 97.65, y: 0.0 }, { x: 97.65, y: 94.31 }, { x: 30.96, y: 27.62 },
        { x: 27.62, y: 30.96 }, { x: 94.31, y: 97.65 }, { x: 0.0, y: 97.65 },
        { x: 0.0, y: 102.37 }, { x: 94.31, y: 102.37 }, { x: 27.62, y: 169.06 },
        { x: 30.96, y: 172.4 }, { x: 97.65, y: 105.71 }, { x: 97.65, y: 200.0 },
        { x: 102.37, y: 200.0 }, { x: 102.37, y: 105.71 }, { x: 169.06, y: 172.4 },
        { x: 172.4, y: 169.06 }, { x: 105.71, y: 102.37 }, { x: 200.0, y: 102.37 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS, fill: fillColor, stroke: strokeColor,
        strokeWidth: strokeWidth, strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addAsterisk16thin: () => {
      const points = [
        { x: 200.0, y: 97.65 }, { x: 111.84, y: 97.65 }, { x: 193.3, y: 63.91 },
        { x: 191.49, y: 59.55 }, { x: 110.04, y: 93.28 }, { x: 172.4, y: 30.96 },
        { x: 169.03, y: 27.62 }, { x: 106.73, y: 89.96 }, { x: 140.46, y: 8.51 },
        { x: 136.09, y: 6.71 }, { x: 102.35, y: 88.14 }, { x: 102.35, y: 0.0 },
        { x: 97.65, y: 0.0 }, { x: 97.65, y: 88.14 }, { x: 63.91, y: 6.71 },
        { x: 59.55, y: 8.51 }, { x: 93.27, y: 89.96 }, { x: 30.96, y: 27.62 },
        { x: 27.62, y: 30.96 }, { x: 89.96, y: 93.28 }, { x: 8.51, y: 59.55 },
        { x: 6.71, y: 63.91 }, { x: 88.14, y: 97.65 }, { x: 0.0, y: 97.65 },
        { x: 0.0, y: 102.35 }, { x: 88.14, y: 102.35 }, { x: 6.71, y: 136.09 },
        { x: 8.51, y: 140.46 }, { x: 89.96, y: 106.72 }, { x: 27.62, y: 169.03 },
        { x: 30.96, y: 172.4 }, { x: 93.27, y: 110.04 }, { x: 59.55, y: 191.49 },
        { x: 63.91, y: 193.3 }, { x: 97.65, y: 111.85 }, { x: 97.65, y: 200.0 },
        { x: 102.35, y: 200.0 }, { x: 102.35, y: 111.85 }, { x: 136.09, y: 193.3 },
        { x: 140.46, y: 191.49 }, { x: 106.73, y: 110.04 }, { x: 169.03, y: 172.4 },
        { x: 172.4, y: 169.03 }, { x: 110.04, y: 106.72 }, { x: 191.49, y: 140.46 },
        { x: 193.3, y: 136.09 }, { x: 111.84, y: 102.35 }, { x: 200.0, y: 102.35 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS, fill: fillColor, stroke: strokeColor,
        strokeWidth: strokeWidth, strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addAsterisk24: () => {
      const points = [
        { x: 200.0, y: 97.65 }, { x: 117.9, y: 97.65 }, { x: 197.18, y: 76.4 },
        { x: 195.96, y: 71.84 }, { x: 116.68, y: 93.09 }, { x: 187.77, y: 52.05 },
        { x: 185.41, y: 47.96 }, { x: 114.32, y: 89.0 }, { x: 172.35, y: 30.95 },
        { x: 169.01, y: 27.61 }, { x: 110.99, y: 85.67 }, { x: 152.0, y: 14.58 },
        { x: 147.91, y: 12.22 }, { x: 106.9, y: 83.31 }, { x: 128.15, y: 4.02 },
        { x: 123.59, y: 2.81 }, { x: 102.35, y: 82.09 }, { x: 102.35, y: 0.0 },
        { x: 97.65, y: 0.0 }, { x: 97.65, y: 82.09 }, { x: 76.4, y: 2.81 },
        { x: 71.84, y: 4.02 }, { x: 93.09, y: 83.31 }, { x: 52.05, y: 12.22 },
        { x: 47.96, y: 14.58 }, { x: 89.0, y: 85.67 }, { x: 30.95, y: 27.61 },
        { x: 27.61, y: 30.95 }, { x: 85.67, y: 89.0 }, { x: 14.58, y: 47.96 },
        { x: 12.22, y: 52.05 }, { x: 83.31, y: 93.09 }, { x: 4.02, y: 71.84 },
        { x: 2.81, y: 76.4 }, { x: 82.09, y: 97.65 }, { x: 0.0, y: 97.65 },
        { x: 0.0, y: 102.35 }, { x: 82.09, y: 102.35 }, { x: 2.81, y: 123.59 },
        { x: 4.02, y: 128.15 }, { x: 83.31, y: 106.9 }, { x: 12.22, y: 147.91 },
        { x: 14.58, y: 152.0 }, { x: 89.0, y: 110.99 }, { x: 27.61, y: 169.01 },
        { x: 30.95, y: 172.35 }, { x: 85.67, y: 110.99 }, { x: 47.96, y: 185.41 },
        { x: 52.05, y: 187.77 }, { x: 93.09, y: 114.32 }, { x: 71.84, y: 195.96 },
        { x: 76.4, y: 197.18 }, { x: 97.65, y: 117.9 }, { x: 97.65, y: 200.0 },
        { x: 102.35, y: 200.0 }, { x: 102.35, y: 117.9 }, { x: 123.59, y: 197.18 },
        { x: 128.15, y: 195.96 }, { x: 106.9, y: 114.32 }, { x: 147.91, y: 187.77 },
        { x: 152.0, y: 185.41 }, { x: 110.99, y: 110.99 }, { x: 169.01, y: 172.35 },
        { x: 172.35, y: 169.01 }, { x: 114.32, y: 106.9 }, { x: 185.41, y: 152.0 },
        { x: 187.77, y: 147.91 }, { x: 117.9, y: 102.35 }, { x: 200.0, y: 102.35 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS, fill: fillColor, stroke: strokeColor,
        strokeWidth: strokeWidth, strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },

    addSplash8: () => {
      const object = new fabric.Path(
        "M1133.14,194.42C956.33,347.64,680.47,233.37,663.78,0h0s0,0,0,0c-16.69,233.37-292.55,347.63-469.36,194.42C347.63,371.23,233.37,647.09,0,663.78c233.37,16.69,347.63,292.55,194.42,469.36,176.82-153.22,452.68-38.95,469.36,194.42h0s0,0,0,0c16.69-233.37,292.55-347.63,469.36-194.42-153.22-176.82-38.95-452.68,194.42-469.36-233.37-16.69-347.63-292.55-194.42-469.36Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addFlower4: () => {
      const object = new fabric.Path(
        "M1054.82,411.04c-82.5,0-198.09,51-294.64,116.34,65.34-96.56,116.34-212.14,116.34-294.65C876.52,104.2,772.32,0,643.78,0s-232.74,104.2-232.74,232.74c0,82.5,51,198.09,116.34,294.64-96.56-65.34-212.14-116.34-294.64-116.34C104.2,411.04,0,515.24,0,643.78s104.2,232.74,232.74,232.74c82.5,0,198.09-51,294.64-116.34-65.34,96.56-116.34,212.14-116.34,294.65,0,128.54,104.2,232.74,232.74,232.74s232.74-104.2,232.74-232.74c0-82.5-51-198.09-116.34-294.65,96.56,65.34,212.15,116.34,294.65,116.34,128.54,0,232.74-104.2,232.74-232.74s-104.2-232.74-232.74-232.74Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addFlower8: () => {
      const object = new fabric.Path(
        "M1123.3,801.71c208.34-5.33,208.34-318.53,0-323.86-7.27-.19-14.57-.28-21.9-.28-26.83,0-53.2,1.3-79.02,3.73,19.98-16.54,39.54-34.27,58.51-53.24,5.66-5.66,11.21-11.37,16.65-17.12,142.34-150.52-78.41-371.27-228.93-228.93-5.76,5.44-11.46,10.99-17.12,16.65-18.97,18.97-36.7,38.54-53.24,58.51,2.43-25.82,3.73-52.18,3.73-79.01,0-7.33-.09-14.63-.28-21.9-5.33-208.34-318.53-208.34-323.86,0-.19,7.26-.28,14.56-.28,21.9,0,26.83,1.3,53.2,3.73,79.01-16.54-19.97-34.26-39.54-53.24-58.51-5.66-5.66-11.37-11.21-17.12-16.65C260.42,39.67,39.67,260.42,182.01,410.94c5.44,5.76,10.99,11.46,16.65,17.12,18.97,18.97,38.54,36.7,58.51,53.24-25.82-2.43-52.18-3.73-79.01-3.73-7.33,0-14.63.1-21.9.28-208.34,5.33-208.34,318.53,0,323.86,7.26.18,14.56.28,21.9.28,26.83,0,53.2-1.3,79.01-3.73-19.97,16.54-39.54,34.27-58.51,53.24-5.66,5.66-11.21,11.36-16.65,17.12-142.34,150.52,78.41,371.27,228.93,228.93,5.76-5.44,11.47-10.99,17.12-16.65,18.97-18.97,36.7-38.54,53.24-58.51-2.43,25.82-3.73,52.18-3.73,79.01,0,7.33.09,14.63.28,21.9,5.33,208.34,318.53,208.34,323.86,0,.19-7.27.28-14.57.28-21.9,0-26.83-1.3-53.2-3.73-79.01,16.54,19.97,34.27,39.54,53.24,58.51,5.66,5.66,11.37,11.21,17.12,16.65,150.52,142.34,371.27-78.41,228.93-228.93-5.44-5.76-10.99-11.46-16.65-17.12-18.97-18.97-38.53-36.7-58.51-53.24,25.82,2.43,52.18,3.73,79.02,3.73,7.33,0,14.63-.1,21.9-.28Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addFlower10: () => {
      const object = new fabric.Path(
        "M1325.78,662.89c0-79.47-104.31-143.9-232.99-143.9-35.3,0-76.66,5.78-119.99,15.53,37.53-23.75,70.87-48.91,95.83-73.87,90.99-90.99,119.19-210.3,62.99-266.5-56.2-56.2-175.51-27.99-266.49,62.99-24.96,24.96-50.12,58.3-73.87,95.83,9.74-43.33,15.53-84.7,15.53-119.99C806.79,104.31,742.36,0,662.89,0s-143.9,104.31-143.9,232.99c0,35.3,5.78,76.66,15.53,119.99-23.75-37.53-48.91-70.87-73.87-95.83-90.99-90.99-210.3-119.19-266.5-62.99-56.19,56.2-27.99,175.51,63,266.5,24.96,24.96,58.3,50.12,95.83,73.87-43.33-9.75-84.7-15.53-119.99-15.53C104.31,518.99,0,583.42,0,662.89s104.31,143.9,232.99,143.9c35.3,0,76.66-5.78,119.99-15.53-37.53,23.75-70.87,48.91-95.83,73.87-90.99,90.99-119.19,210.3-63,266.5,56.2,56.2,175.51,27.99,266.5-63,24.96-24.96,50.12-58.3,73.87-95.83-9.75,43.33-15.53,84.69-15.53,119.99,0,128.67,64.43,232.99,143.9,232.99s143.9-104.31,143.9-232.99c0-35.3-5.78-76.66-15.53-119.99,23.75,37.53,48.91,70.87,73.87,95.83,90.99,90.99,210.3,119.19,266.49,63,56.2-56.2,27.99-175.51-62.99-266.5-24.96-24.96-58.3-50.12-95.83-73.87,43.33,9.75,84.69,15.53,119.99,15.53,128.68,0,232.99-64.43,232.99-143.9Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addFlower18: () => {
      const object = new fabric.Path(
        "M1312,656c0-39.04-33.96-69.39-72.75-65.04l-364.68,21.56,345.17-119.64c37.51-10.82,57.26-51.86,42.32-87.93h0c-14.94-36.07-57.93-51.12-92.1-32.25l-328.67,159.48,273.11-242.62c30.51-24.35,33.05-69.83,5.45-97.43-27.6-27.6-73.08-25.06-97.43,5.45l-242.62,273.11,159.48-328.67c18.87-34.17,3.82-77.16-32.25-92.1-36.06-14.94-77.1,4.81-87.93,42.32l-119.64,345.17,21.56-364.68c4.35-38.79-26-72.75-65.04-72.75h0c-39.04,0-69.39,33.95-65.04,72.75l21.56,364.68-119.63-345.17c-10.82-37.51-51.86-57.26-87.93-42.32-36.07,14.94-51.12,57.93-32.25,92.1l159.48,328.67-242.62-273.11c-24.35-30.51-69.83-33.05-97.43-5.45-27.6,27.6-25.06,73.08,5.45,97.43l273.11,242.62-328.67-159.48c-34.17-18.87-77.16-3.82-92.1,32.25h0c-14.94,36.07,4.81,77.11,42.32,87.93l345.17,119.64-364.68-21.56c-38.79-4.35-72.75,26-72.75,65.04s33.96,69.39,72.75,65.04l364.68-21.56-345.17,119.64c-37.51,10.82-57.26,51.86-42.32,87.93,14.94,36.07,57.93,51.12,92.1,32.25l328.67-159.48-273.11,242.62c-30.51,24.35-33.05,69.83-5.45,97.43,27.6,27.6,73.08,25.06,97.43-5.45l242.62-273.11-159.48,328.67c-18.87,34.17-3.82,77.16,32.25,92.1,36.07,14.94,77.1-4.81,87.93-42.32l119.63-345.17-21.56,364.68c-4.35,38.79,26,72.75,65.04,72.75h0c39.04,0,69.39-33.95,65.04-72.75l-21.56-364.68,119.64,345.17c10.82,37.51,51.86,57.26,87.93,42.32,36.07-14.94,51.12-57.93,32.25-92.1l-159.48-328.67,242.62,273.11c24.35,30.51,69.83,33.05,97.43,5.45,27.6-27.6,25.06-73.08-5.45-97.43l-273.11-242.62,328.67,159.48c34.17,18.87,77.16,3.82,92.1-32.25,14.94-36.07-4.81-77.11-42.32-87.93l-345.17-119.64,364.68,21.56c38.79,4.35,72.75-26,72.75-65.04Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },

    addSvgShape: (svgString: string) => {
      fabric.loadSVGFromString(svgString, (objects, options) => {
        const obj = fabric.util.groupSVGElements(objects, options);

        // Aplica a cor da paleta (silhueta solida)
        if ("forEachObject" in obj && typeof (obj as any).forEachObject === "function") {
          (obj as any).forEachObject((o: any) => {
            o.set({ fill: fillColor, stroke: strokeColor });
          });
        } else {
          obj.set({ fill: fillColor, stroke: strokeColor });
        }

        obj.scaleToWidth(200);

        // Aplica as opcoes padrao (editavel, etc) igual as outras formas
        obj.set({
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        } as any);

        addToCanvas(obj);
      });
    },

    addSeta1: () => {
      const object = new fabric.Path(
        "M1222.16,429.96l-481.38,340.07c-35.2,24.87-85.64,1.39-85.64-39.85v-171.71H53.43c-29.51,0-53.43-22.37-53.43-49.95v-236.81c0-27.59,23.92-49.95,53.43-49.95h601.71V50.04c0-41.24,50.44-64.72,85.64-39.85l481.38,340.07c28.29,19.99,28.29,59.72,0,79.71Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addSeta2: () => {
      const object = new fabric.Path(
        "M71.22,559.01h905.31l-295,295c-27.82,27.82-27.82,72.89,0,100.71,27.82,27.82,72.89,27.82,100.71,0l416.53-416.53c3.33-3.32,6.31-6.99,8.93-10.92,1.13-1.69,1.9-3.53,2.87-5.29,1.27-2.3,2.66-4.52,3.67-6.97.96-2.31,1.5-4.73,2.21-7.11.61-2.06,1.41-4.04,1.83-6.17,1.83-9.2,1.83-18.68,0-27.89-.42-2.14-1.22-4.11-1.83-6.17-.7-2.38-1.25-4.79-2.21-7.11-1.01-2.45-2.4-4.67-3.67-6.97-.97-1.76-1.74-3.59-2.87-5.29-2.62-3.93-5.6-7.6-8.93-10.92L782.24,20.87c-13.91-13.91-32.13-20.87-50.35-20.87s-36.44,6.96-50.35,20.87c-27.82,27.82-27.82,72.89,0,100.71l295,295H71.22c-39.33,0-71.22,31.89-71.22,71.22s31.89,71.22,71.22,71.22Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addSeta4: () => {
      const object = new fabric.Path(
        "M87.75,418.19h749.8v188.47c0,48.2,58.28,72.34,92.36,38.26l276.23-276.23c21.13-21.12,21.13-55.38,0-76.51L929.91,15.96c-34.08-34.08-92.36-9.95-92.36,38.25v188.47H87.75C39.29,242.68,0,281.98,0,330.44s39.29,87.75,87.75,87.75Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addSeta5: () => {
      const object = new fabric.Path(
        "M114.59,0c29.34,0,58.64,11.18,81.03,33.56l252.78,252.78c21.49,21.49,33.56,50.64,33.56,81.03s-12.07,59.54-33.56,81.03l-252.78,252.74c-44.78,44.78-117.29,44.78-162.06,0-44.74-44.78-44.74-117.32,0-162.06l171.74-171.71L33.55,195.63c-44.74-44.74-44.74-117.32,0-162.06C55.94,11.18,85.25,0,114.59,0Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addSeta6: () => {
      const object = new fabric.Path(
        "M986.99,316.86L553.21,4c-13.51-9.75-32.91-.57-32.91,15.56v165.85C402.19,201.46,26.68,284.9.09,698.69c-1.65,25.66,20.28,47.18,47.29,47.18h3.12c18.65,0,35.42-10.43,43.15-26.59,31.15-65.14,137.76-228.26,426.66-240.68v166.68c0,16.14,19.4,25.31,32.91,15.56l433.77-312.86c10.83-7.81,10.83-23.31,0-31.12Z",
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      object.scaleToWidth(200);
      addToCanvas(object);
    },
    addSeta3: () => {
      const points = [
        { x: 0.0, y: 121.0 },
        { x: 194.32, y: 121.0 },
        { x: 114.87, y: 200.46 },
        { x: 173.65, y: 200.46 },
        { x: 273.86, y: 100.24 },
        { x: 173.65, y: 0.0 },
        { x: 114.87, y: 0.0 },
        { x: 194.32, y: 79.45 },
        { x: 0.0, y: 79.45 },
      ];
      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
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
    
    addPentagon: () => {
      const WIDTH = 200;
      const HEIGHT = 200;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const radius = WIDTH / 2;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 180) * (72 * i - 90);
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }

      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS,
        width: WIDTH,
        height: HEIGHT,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addHexagon: () => {
      const WIDTH = 200;
      const HEIGHT = 200;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const radius = WIDTH / 2;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 90);
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }

      const object = new fabric.Polygon(points, {
        ...DIAMOND_OPTIONS,
        width: WIDTH,
        height: HEIGHT,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
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

// ============================================
  // MULTIPAGINA (Slides 1 - parte 2)
  // Documento version 2 em memoria: guarda TODAS as paginas.
  // O canvas mostra a pagina ativa; ao salvar, sincroniza a ativa
  // no documento e persiste o documento inteiro no banco.
  // ============================================
  const initialDocument = useRef<EditorDocumentV2>(migrateToV2(defaultState));
  const documentRef = useRef<EditorDocumentV2>(initialDocument.current);
  const activePageIdRef = useRef<string>(
    getFirstPageId(initialDocument.current)
  );

  // Estado React espelhando as paginas (pra UI reagir a mudancas)
  const [pages, setPages] = useState<{ id: string }[]>(
    initialDocument.current.pages.map((p) => ({ id: p.id }))
  );
  const [activePageId, setActivePageId] = useState<string>(
    getFirstPageId(initialDocument.current)
  );
  // Cache efemero de miniaturas das paginas (pageId -> dataUrl)
  const pageThumbsRef = useRef<Record<string, string>>({});
  const [thumbsVersion, setThumbsVersion] = useState(0);
  // Flag: quando true, o autosave e suspenso (usado durante export multipagina)
  const isExportingRef = useRef(false);

  // Embrulha o saveCallback: intercepta o json do canvas atual,
  // atualiza o slot da pagina ativa, e manda o documento v2 inteiro.
  const wrappedSaveCallback = useCallback(
    (values: { json: string; height: number; width: number }) => {
      if (!saveCallback) return;

      // Durante export multipagina, nao salva (evita contaminar paginas)
      if (isExportingRef.current) return;

      let pageJson: any = {};
      try {
        pageJson = JSON.parse(values.json);
      } catch {
        pageJson = {};
      }

      // GUARDA: so salva se o estado tem o workspace (clip).
      // Se nao tem, o canvas esta num momento intermediario
      // (carregando/limpo) - salvar aqui corromperia a pagina.
      const hasWorkspace =
        pageJson &&
        Array.isArray(pageJson.objects) &&
        pageJson.objects.some((obj: any) => obj && obj.name === "clip");

      if (!hasWorkspace) {
        return;
      }

      // Sincroniza a pagina ativa no documento (regra de ouro)
      documentRef.current = setPageJson(
        documentRef.current,
        activePageIdRef.current,
        pageJson
      );

      // Persiste o documento v2 inteiro (todas as paginas)
      saveCallback({
        json: serializeDocument(documentRef.current),
        height: values.height,
        width: values.width,
      });
    },
    [saveCallback]
  );

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
    saveCallback: wrappedSaveCallback
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
        documentRef,
        activePageIdRef,
        setPages,
        setActivePageId,
        pageThumbsRef,
        setThumbsVersion,
        isExportingRef,
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