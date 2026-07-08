"use client";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";
import { ShadowSidebar } from "@/features/editor/components/shadow-sidebar";
import { FontSpacingSidebar } from "@/features/editor/components/font-spacing-sidebar";
import { CornerRadiusSidebar } from "@/features/editor/components/corner-radius-sidebar";
import { useSnapGuides } from "@/features/editor/hooks/use-snap-guides";
import { LayersSidebar } from "@/features/editor/components/layers-sidebar";

import { fabric } from "fabric";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";

import { ResponseType } from "@/features/projects/api/use-get-project";
import { useUpdateProject } from "@/features/projects/api/use-update-project";

import {
  ActiveTool,
  selectionDependentTools
} from "@/features/editor/types";
import { Navbar } from "@/features/editor/components/navbar";
import { Footer } from "@/features/editor/components/footer";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { Sidebar } from "@/features/editor/components/sidebar";
import { Toolbar } from "@/features/editor/components/toolbar";
import { ShapeSidebar } from "@/features/editor/components/shape-sidebar";
import { FillColorSidebar } from "@/features/editor/components/fill-color-sidebar";
import { StrokeColorSidebar } from "@/features/editor/components/stroke-color-sidebar";
import { StrokeWidthSidebar } from "@/features/editor/components/stroke-width-sidebar";
import { OpacitySidebar } from "@/features/editor/components/opacity-sidebar";
import { TextSidebar } from "@/features/editor/components/text-sidebar";
import { FontSidebar } from "@/features/editor/components/font-sidebar";
import { ImageSidebar } from "@/features/editor/components/image-sidebar";
import { FilterSidebar } from "@/features/editor/components/filter-sidebar";
import { DrawSidebar } from "@/features/editor/components/draw-sidebar";
import { AiSidebar } from "@/features/editor/components/ai-sidebar";
import { TemplateSidebar } from "@/features/editor/components/template-sidebar";
import { RemoveBgSidebar } from "@/features/editor/components/remove-bg-sidebar";
import { SettingsSidebar } from "@/features/editor/components/settings-sidebar";
import { BrandAssetsSidebar } from "@/features/editor/components/brand-assets-sidebar";
import { useLoadBrandFonts } from "@/features/editor/hooks/use-load-brand-fonts";
import { useEditableBorders } from "@/features/editor/hooks/use-editable-borders";
import { useSellerMode } from "@/features/editor/hooks/use-seller-mode";
import { useEditableHover } from "@/features/editor/hooks/use-editable-hover";

interface EditorProps {
  initialData: ResponseType["data"];
};

export const Editor = ({ initialData }: EditorProps) => {
  const { mutate } = useUpdateProject(initialData.id);

  // Carrega as fontes da marca quando o editor abrir
  useLoadBrandFonts();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(
      (values: {
        json: string,
        height: number,
        width: number,
      }) => {
        mutate(values);
    },
    500
  ), [mutate]);

  const [activeTool, setActiveTool] = useState<ActiveTool>("select");

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    defaultState: initialData.json,
    defaultWidth: initialData.width,
    defaultHeight: initialData.height,
    clearSelectionCallback: onClearSelection,
    saveCallback: debouncedSave,
  });

// Borda azul permanente (so admin)
  useEditableBorders(editor?.canvas || null);

  // Modo Vendedor: aplica travas em elementos do template (so user/dealership_admin)
  // Logica:
  // - Projeto normal (sem sourceTemplateId): vendedor mexe livre
  // - Projeto de template oficial: aplica travas
  // - Projeto de template pessoal DELE: vendedor mexe livre
  const sourceTemplateId = (initialData as any).sourceTemplateId as string | null;
  const { data: sourceTemplate } = useGetProject(sourceTemplateId || "");
  const { data: brandSettingsForRestrict } = useGetBrandSettings();

  const sourceTemplateAny = sourceTemplate as any;
  const sourceVisibility = sourceTemplateAny?.templateVisibility;
  const sourceOwnerId = sourceTemplateAny?.userId;
  const currentUserId = (brandSettingsForRestrict as any)?.userId;

  // Calcula se deve restringir
  let shouldRestrict = false;
  if (sourceTemplateId) {
    if (sourceVisibility === "official") {
      // Template oficial sempre restringe (mesmo se o admin que abriu seria dono)
      shouldRestrict = true;
    } else if (sourceVisibility === "personal") {
      // Template pessoal: so restringe se NAO for o dono
      shouldRestrict = sourceOwnerId !== currentUserId;
    } else if (!sourceVisibility) {
      // Ainda nao carregou: por seguranca, restringe ate carregar
      shouldRestrict = true;
    }
  }

  useSellerMode(editor?.canvas || null, shouldRestrict);

  // Linhas-guia + snap entre elementos (todos os usuarios)
  useSnapGuides(editor?.canvas || null);
  // Hover de borda azul nos editaveis (so vendedor)
  useEditableHover(editor?.canvas || null);

  const onChangeActiveTool = useCallback((tool: ActiveTool) => {
    if (tool === "draw") {
      editor?.enableDrawingMode();
    }

    if (activeTool === "draw") {
      editor?.disableDrawingMode();
    }

    if (tool === activeTool) {
      return setActiveTool("select");
    }

    setActiveTool(tool);
  }, [activeTool, editor]);

  const canvasRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current!,
    });

    return () => {
      canvas.dispose();
    };
  }, [init]);
  
  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={initialData.id}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />
      <div className="absolute h-[calc(100%-68px)] w-full top-[68px] flex">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FillColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeWidthSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <OpacitySidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ShadowSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FontSpacingSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <CornerRadiusSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
          <LayersSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TextSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FontSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ImageSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <BrandAssetsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TemplateSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FilterSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <AiSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <RemoveBgSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <DrawSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <SettingsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <main className="bg-muted flex-1 overflow-hidden relative flex flex-col">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />
          <div className="flex-1 min-h-0 bg-muted" ref={containerRef}>
            <canvas ref={canvasRef} />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};