import { fabric } from "fabric";
import { useEffect, useRef } from "react";

import { JSON_KEYS } from "@/features/editor/types";
import {
  migrateToV2,
  getFirstPageId,
  getPageJson,
} from "@/features/editor/utils/pages";

interface UseLoadStateProps {
  autoZoom: () => void;
  canvas: fabric.Canvas | null;
  initialState: React.MutableRefObject<string | undefined>;
  canvasHistory: React.MutableRefObject<string[]>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
};

export const useLoadState = ({
  canvas,
  autoZoom,
  initialState,
  canvasHistory,
  setHistoryIndex,
}: UseLoadStateProps) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && initialState?.current && canvas) {
      // Migracao lazy: aceita formato antigo (1 tela) OU version 2 (paginas)
      const doc = migrateToV2(initialState.current);
      const firstPageId = getFirstPageId(doc);
      const pageJson = getPageJson(doc, firstPageId) ?? {};

      canvas.loadFromJSON(pageJson, () => {
        const currentState = JSON.stringify(
          canvas.toJSON(JSON_KEYS),
        );

        canvasHistory.current = [currentState];
        setHistoryIndex(0);
        autoZoom();
      });
      initialized.current = true;
    }
  },
  [
    canvas,
    autoZoom,
    initialState,
    canvasHistory,
    setHistoryIndex,
  ]);
};