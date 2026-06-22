import { useState, useEffect } from "react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface FontSpacingSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const FontSpacingSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: FontSpacingSidebarProps) => {
  const [lineHeight, setLineHeight] = useState(1.16);
  const [charSpacing, setCharSpacing] = useState(0);

  useEffect(() => {
    if (activeTool !== "font-spacing") return;
    setLineHeight(editor?.getActiveFontLineHeight() ?? 1.16);
    setCharSpacing(editor?.getActiveFontCharSpacing() ?? 0);
  }, [editor, activeTool]);

  const onClose = () => onChangeActiveTool("select");

  const onChangeLineHeight = (value: number) => {
    setLineHeight(value);
    editor?.changeFontLineHeight(value);
  };

  const onChangeCharSpacing = (value: number) => {
    setCharSpacing(value);
    editor?.changeFontCharSpacing(value);
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "font-spacing" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Espacamento"
        description="Ajuste altura da linha e espaco entre letras"
      />

      <ScrollArea>
        <div className="p-4 space-y-6">
          {/* Altura da linha */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-slate-600">Altura da linha</Label>
              <span className="text-xs text-slate-500">
                {lineHeight.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[lineHeight]}
              min={0.5}
              max={3}
              step={0.05}
              onValueChange={(values) => onChangeLineHeight(values[0])}
            />
          </div>

          {/* Espaco entre letras */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-slate-600">
                Espaco entre letras
              </Label>
              <span className="text-xs text-slate-500">{charSpacing}</span>
            </div>
            <Slider
              value={[charSpacing]}
              min={-200}
              max={2000}
              step={10}
              onValueChange={(values) => onChangeCharSpacing(values[0])}
            />
          </div>
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};