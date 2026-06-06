import { fabric } from "fabric";
import { useEvent } from "react-use";

interface UseHotkeysProps {
  canvas: fabric.Canvas | null;
  undo: () => void;
  redo: () => void;
  save: (skip?: boolean) => void;
  copy: () => void;
  paste: () => void;
}

export const useHotkeys = ({ canvas, undo, redo, save, copy, paste }: UseHotkeysProps) => {
  useEvent("keydown", (event) => {
    const isCtrlKey = event.ctrlKey || event.metaKey;
    const isBackspace = event.key === "Backspace";
    const isInput = ["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName);

    if (isInput) return;

    // Pula atalhos se o usuario esta editando texto inline no canvas (duplo clique)
    const activeObject = canvas?.getActiveObject();
    // @ts-ignore - isEditing existe em Textbox/IText quando esta em modo edicao
    const isEditingText = activeObject && activeObject.isEditing === true;
    if (isEditingText) return;

    // delete key
    if (event.keyCode === 46) {
      canvas?.getActiveObjects().forEach((Object) => canvas?.remove(Object));
      canvas?.discardActiveObject();
      canvas?.renderAll();
    }

    if (isBackspace) {
      canvas?.remove(...canvas.getActiveObjects());
      canvas?.discardActiveObject();
    }

    if (isCtrlKey && event.key === "z") {
      event.preventDefault();
      undo();
    }

    if (isCtrlKey && event.key === "y") {
      event.preventDefault();
      redo();
    }

    if (isCtrlKey && event.key === "c") {
      event.preventDefault();
      copy();
    }

    if (isCtrlKey && event.key === "v") {
      event.preventDefault();
      paste();
    }

    if (isCtrlKey && event.key === "s") {
      event.preventDefault();
      save(true);
    }

    if (isCtrlKey && event.key === "a") {
      event.preventDefault();
      canvas?.discardActiveObject();

      const allObjects = canvas?.getObjects().filter((object) => object.selectable);

      canvas?.setActiveObject(new fabric.ActiveSelection(allObjects, { canvas }));
      canvas?.renderAll();
    }

    // Ctrl+D - Duplicar elemento selecionado
    if (isCtrlKey && event.key === "d") {
      event.preventDefault(); // impede o navegador de adicionar aos favoritos
      if (canvas?.getActiveObject()) {
        copy();
        paste();
      }
    }

    // Setas do teclado - mover elemento selecionado
    const isArrow =
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight";

    if (isArrow && !isCtrlKey) {
      const active = canvas?.getActiveObject();
      if (!active) return;

      event.preventDefault();

      // Shift = passo maior (10px), normal = 1px
      const step = event.shiftKey ? 10 : 1;

      if (event.key === "ArrowUp") {
        active.set("top", (active.top || 0) - step);
      }
      if (event.key === "ArrowDown") {
        active.set("top", (active.top || 0) + step);
      }
      if (event.key === "ArrowLeft") {
        active.set("left", (active.left || 0) - step);
      }
      if (event.key === "ArrowRight") {
        active.set("left", (active.left || 0) + step);
      }

      active.setCoords();
      canvas?.requestRenderAll();

      // Dispara save (debounced) - reusa o evento que ja tem listener
      canvas?.fire("object:modified");
    }
  });
};