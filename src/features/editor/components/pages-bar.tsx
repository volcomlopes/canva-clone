"use client";

import { useState, useEffect } from "react";
import { Plus, MoreVertical, Copy, Trash, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Editor } from "@/features/editor/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";

interface PagesBarProps {
  editor: Editor | undefined;
  lockPages?: boolean;
};

export const PagesBar = ({ editor, lockPages }: PagesBarProps) => {
  const [, forceTick] = useState(0);

  const [ConfirmDeleteDialog, confirmDelete] = useConfirm(
    "Excluir esta pagina?",
    "A pagina e todo o seu conteudo serao removidos deste projeto."
  );

  const pages = editor?.getPages() || [];
  const activePageId = editor?.getActivePageId();

  useEffect(() => {
    forceTick((t) => t + 1);
  }, [activePageId, pages.length]);

  if (!editor) {
    return null;
  }

  const rerender = () => forceTick((t) => t + 1);

  const onAddPage = () => {
    editor.addPage();
    rerender();
  };

  const onGoToPage = (pageId: string) => {
    editor.goToPage(pageId);
    rerender();
  };

  const onDuplicate = (pageId: string) => {
    editor.duplicatePage(pageId);
    rerender();
  };

  const onMove = (pageId: string, direction: "left" | "right") => {
    editor.movePage(pageId, direction);
    rerender();
  };

  const onDelete = async (pageId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;
    editor.deletePage(pageId);
    rerender();
  };

  const isOnlyPage = pages.length <= 1;

  return (
    <div className="w-full flex items-start gap-x-3 overflow-x-auto px-4 py-3">
      <ConfirmDeleteDialog />
      {pages.map((page, index) => {
        const isActive = page.id === activePageId;
        const isFirst = index === 0;
        const isLast = index === pages.length - 1;
        const thumb = editor.getPageThumb(page.id);

        return (
          <div key={page.id} className="flex-shrink-0 group/page">
            <div className="relative">
              <button
                type="button"
                onClick={() => onGoToPage(page.id)}
                className={cn(
                  "w-[70px] h-[90px] rounded-md bg-white transition-all flex items-center justify-center overflow-hidden relative",
                  isActive
                    ? "border-2 border-blue-500"
                    : "border border-slate-200 hover:border-slate-400"
                )}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={`Pagina ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">
                    {index + 1}
                  </span>
                )}
              </button>

              {/* Menu de tres pontinhos (some quando travado) */}
              {!lockPages && (
              <div
                className="absolute top-0.5 right-0.5 opacity-0 group-hover/page:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-5 w-5 rounded bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                    >
                      <MoreVertical className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onDuplicate(page.id)}
                    >
                      <Copy className="size-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={isFirst}
                      onClick={() => onMove(page.id, "left")}
                    >
                      <ArrowLeft className="size-4 mr-2" />
                      Mover para esquerda
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={isLast}
                      onClick={() => onMove(page.id, "right")}
                    >
                      <ArrowRight className="size-4 mr-2" />
                      Mover para direita
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                      disabled={isOnlyPage}
                      onClick={() => onDelete(page.id)}
                    >
                      <Trash className="size-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              )}
            </div>

            {/* Faixa embaixo: setas de reordenar + numero (setas somem se travado) */}
            <div className="flex items-center justify-center gap-1 mt-1">
              {!lockPages && (
                <button
                  type="button"
                  onClick={() => onMove(page.id, "left")}
                  disabled={isFirst}
                  title="Mover para esquerda"
                  className={cn(
                    "h-5 w-5 rounded flex items-center justify-center transition-colors",
                    isFirst
                      ? "text-slate-200 cursor-not-allowed"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <ChevronLeft className="size-3.5" />
                </button>
              )}

              <span
                className={cn(
                  "text-xs min-w-[14px] text-center",
                  isActive ? "text-slate-700 font-medium" : "text-slate-400"
                )}
              >
                {index + 1}
              </span>

              {!lockPages && (
                <button
                  type="button"
                  onClick={() => onMove(page.id, "right")}
                  disabled={isLast}
                  title="Mover para direita"
                  className={cn(
                    "h-5 w-5 rounded flex items-center justify-center transition-colors",
                    isLast
                      ? "text-slate-200 cursor-not-allowed"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <ChevronRight className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!lockPages && (
        <button
          type="button"
          onClick={onAddPage}
          title="Adicionar pagina"
          className="flex-shrink-0 w-[70px] h-[90px] rounded-md border border-dashed border-slate-300 hover:border-slate-500 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors mt-0"
        >
          <Plus className="size-5" />
        </button>
      )}
    </div>
  );
};