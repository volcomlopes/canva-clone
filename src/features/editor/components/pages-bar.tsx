"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

import { Editor } from "@/features/editor/types";
import { cn } from "@/lib/utils";

interface PagesBarProps {
  editor: Editor | undefined;
};

export const PagesBar = ({ editor }: PagesBarProps) => {
  // Estado local pra forcar re-render quando paginas mudam
  const [, forceTick] = useState(0);

  const pages = editor?.getPages() || [];
  const activePageId = editor?.getActivePageId();

  // Re-renderiza quando o editor muda (troca/adiciona pagina)
  useEffect(() => {
    forceTick((t) => t + 1);
  }, [activePageId, pages.length]);

  if (!editor) {
    return null;
  }

  const onAddPage = () => {
    editor.addPage();
    forceTick((t) => t + 1);
  };

  const onGoToPage = (pageId: string) => {
    editor.goToPage(pageId);
    forceTick((t) => t + 1);
  };

  return (
    <div className="w-full flex items-end gap-x-3 overflow-x-auto px-4 py-3">
      {pages.map((page, index) => {
        const isActive = page.id === activePageId;
        return (
          <div key={page.id} className="flex-shrink-0 text-center">
            <button
              type="button"
              onClick={() => onGoToPage(page.id)}
              className={cn(
                "w-[70px] h-[90px] rounded-md bg-white transition-all flex items-center justify-center overflow-hidden",
                isActive
                  ? "border-2 border-blue-500"
                  : "border border-slate-200 hover:border-slate-400"
              )}
            >
              <span className="text-xs text-slate-400">
                {index + 1}
              </span>
            </button>
            <div
              className={cn(
                "text-xs mt-1",
                isActive ? "text-slate-700 font-medium" : "text-slate-400"
              )}
            >
              {index + 1}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAddPage}
        title="Adicionar pagina"
        className="flex-shrink-0 w-[70px] h-[90px] rounded-md border border-dashed border-slate-300 hover:border-slate-500 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
};