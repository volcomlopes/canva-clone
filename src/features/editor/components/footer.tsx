"use client";

import { useState } from "react";
import { Minimize, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from "lucide-react";

import { Editor } from "@/features/editor/types";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";

import { PagesBar } from "@/features/editor/components/pages-bar";

interface FooterProps {
  editor: Editor | undefined;
  lockPages?: boolean;
};

export const Footer = ({ editor, lockPages }: FooterProps) => {
  const [pagesOpen, setPagesOpen] = useState(true);

  const pageCount = editor?.getPages().length || 0;

  return (
    <div className="flex flex-col w-full shrink-0 z-[49] border-t bg-white">
      {/* Faixa de paginas (recolhivel) */}
      {pagesOpen && (
        <div className="border-b bg-slate-50">
          <PagesBar editor={editor} lockPages={lockPages} />
        </div>
      )}

      {/* Barra de zoom + recolher */}
      <footer className="h-[52px] bg-white w-full flex items-center p-2 gap-x-1 px-4">
        {/* Esquerda: recolher paginas */}
        <div className="flex items-center gap-x-2">
          <Hint
            label={pagesOpen ? "Recolher paginas" : "Mostrar paginas"}
            side="top"
            sideOffset={10}
          >
            <Button
              onClick={() => setPagesOpen((v) => !v)}
              size="icon"
              variant="ghost"
              className="h-full"
            >
              {pagesOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </Button>
          </Hint>
          <span className="text-xs text-muted-foreground">
            {pageCount} {pageCount === 1 ? "pagina" : "paginas"}
          </span>
        </div>

        {/* Direita: zoom */}
        <div className="ml-auto flex items-center gap-x-1">
          <Hint label="Zoom out" side="top" sideOffset={10}>
            <Button
              onClick={() => editor?.zoomOut()}
              size="icon"
              variant="ghost"
              className="h-full"
            >
              <ZoomOut className="size-4" />
            </Button>
          </Hint>
          <Hint label="Zoom in" side="top" sideOffset={10}>
            <Button
              onClick={() => editor?.zoomIn()}
              size="icon"
              variant="ghost"
              className="h-full"
            >
              <ZoomIn className="size-4" />
            </Button>
          </Hint>
          <Hint label="Reset" side="top" sideOffset={10}>
            <Button
              onClick={() => editor?.autoZoom()}
              size="icon"
              variant="ghost"
              className="h-full"
            >
              <Minimize className="size-4" />
            </Button>
          </Hint>
        </div>
      </footer>
    </div>
  );
};