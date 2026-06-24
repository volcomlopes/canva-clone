import { useState } from "react";
import { useParams } from "next/navigation";

import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaUnderline
} from "react-icons/fa";
import { TbColorFilter } from "react-icons/tb";
import { BsBorderWidth } from "react-icons/bs";
import { RxTransparencyGrid } from "react-icons/rx";
import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Trash,
  SquareSplitHorizontal,
  Copy,
  Lock,
  Unlock,
  SquareStack,
  MoveVertical,
  Spline,
  Crop,
  Check,
  X,
} from "lucide-react";



import { isTextType } from "@/features/editor/utils";
import { FontSizeInput } from "@/features/editor/components/font-size-input";

import {
  ActiveTool,
  Editor,
  FONT_SIZE,
  FONT_WEIGHT
} from "@/features/editor/types";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

export const Toolbar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ToolbarProps) => {
  const params = useParams();
  const projectId = params?.projectId as string;

  const { data: project } = useGetProject(projectId);
  const { data: brandSettings } = useGetBrandSettings();

  const isBrandAdmin = brandSettings?.userRole === "brand_admin";
  const isTemplate = project?.isTemplate === true;
  const showControls = brandSettings?.showTemplateControls === true;

  const canToggleEditable = isBrandAdmin && (isTemplate || showControls);

  const initialFillColor = editor?.getActiveFillColor();
  const initialStrokeColor = editor?.getActiveStrokeColor();
  const initialFontFamily = editor?.getActiveFontFamily();
  const initialFontWeight = editor?.getActiveFontWeight() || FONT_WEIGHT;
  const initialFontStyle = editor?.getActiveFontStyle();
  const initialFontLinethrough = editor?.getActiveFontLinethrough();
  const initialFontUnderline = editor?.getActiveFontUnderline();
  const initialTextAlign = editor?.getActiveTextAlign();
  const initialFontSize = editor?.getActiveFontSize() || FONT_SIZE;
  const initialLineHeight = editor?.getActiveFontLineHeight() || 1.16;
  const initialCharSpacing = editor?.getActiveFontCharSpacing() || 0;
  const initialIsEditable = editor?.getActiveEditable() || false;

  const [properties, setProperties] = useState({
    fillColor: initialFillColor,
    strokeColor: initialStrokeColor,
    fontFamily: initialFontFamily,
    fontWeight: initialFontWeight,
    fontStyle: initialFontStyle,
    fontLinethrough: initialFontLinethrough,
    fontUnderline: initialFontUnderline,
    textAlign: initialTextAlign,
    fontSize: initialFontSize,
    lineHeight: initialLineHeight,
    charSpacing: initialCharSpacing,
    isEditable: initialIsEditable,
  });

  const selectedObject = editor?.selectedObjects[0];
  const selectedObjectType = editor?.selectedObjects[0]?.type;

  const isText = isTextType(selectedObjectType);
  const isImage = selectedObjectType === "image";
  const isRectangle = selectedObjectType === "rect";

  const onChangeFontSize = (value: number) => {
    if (!selectedObject) return;
    editor?.changeFontSize(value);
    setProperties((current) => ({ ...current, fontSize: value }));
  };

const onChangeLineHeight = (value: number) => {
    if (!selectedObject) {
      return;
    }

    editor?.changeFontLineHeight(value);
    setProperties((current) => ({
      ...current,
      lineHeight: value,
    }));
  };

  const onChangeCharSpacing = (value: number) => {
    if (!selectedObject) {
      return;
    }

    editor?.changeFontCharSpacing(value);
    setProperties((current) => ({
      ...current,
      charSpacing: value,
    }));
  };

  const onChangeTextAlign = (value: string) => {
    if (!selectedObject) return;
    editor?.changeTextAlign(value);
    setProperties((current) => ({ ...current, textAlign: value }));
  };

  const toggleBold = () => {
    if (!selectedObject) return;
    const newValue = properties.fontWeight > 500 ? 500 : 700;
    editor?.changeFontWeight(newValue);
    setProperties((current) => ({ ...current, fontWeight: newValue }));
  };

  const toggleItalic = () => {
    if (!selectedObject) return;
    const isItalic = properties.fontStyle === "italic";
    const newValue = isItalic ? "normal" : "italic";
    editor?.changeFontStyle(newValue);
    setProperties((current) => ({ ...current, fontStyle: newValue }));
  };

  const toggleLinethrough = () => {
    if (!selectedObject) return;
    const newValue = properties.fontLinethrough ? false : true;
    editor?.changeFontLinethrough(newValue);
    setProperties((current) => ({ ...current, fontLinethrough: newValue }));
  };

  const toggleUnderline = () => {
    if (!selectedObject) return;
    const newValue = properties.fontUnderline ? false : true;
    editor?.changeFontUnderline(newValue);
    setProperties((current) => ({ ...current, fontUnderline: newValue }));
  };

  const handleToggleEditable = () => {
    if (!selectedObject) return;
    editor?.toggleEditable();
    setProperties((current) => ({ ...current, isEditable: !current.isEditable }));
  };

  // MODO CROP: toolbar troca pra so Aplicar / Cancelar
  // Dirigido por activeTool (mecanismo confiavel, igual aos outros tools)
  if (activeTool === "crop") {
    return (
      <div className="shrink-0 h-[56px] border-b bg-white w-full flex items-center overflow-x-auto z-[49] p-2 gap-x-2">
        <div className="flex items-center gap-x-2">
          <Button
            onClick={() => {
              editor?.applyCrop();
              onChangeActiveTool("select");
            }}
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="size-4" />
            Aplicar recorte
          </Button>
          <Button
            onClick={() => {
              editor?.cancelCrop();
              onChangeActiveTool("select");
            }}
            size="sm"
            variant="outline"
            className="gap-2 text-slate-600"
          >
            <X className="size-4" />
            Cancelar
          </Button>
          <span className="text-sm text-slate-400 ml-2 hidden sm:inline">
            Arraste os cantos para definir a area, depois clique em Aplicar.
          </span>
        </div>
      </div>
    );
  }

  if (editor?.selectedObjects.length === 0) {
    return (
      <div className="shrink-0 h-[56px] border-b bg-white w-full flex items-center overflow-x-auto z-[49] p-2 gap-x-2" />
    );
  }

  // Verifica se ha multiplos elementos selecionados (label dos botoes muda)
  const multipleSelected = (editor?.selectedObjects?.length || 0) > 1;
  const alignTargetLabel = multipleSelected ? "selecao" : "canvas";

  return (
    <div className="shrink-0 h-[56px] border-b bg-white w-full flex items-center overflow-x-auto z-[49] p-2 gap-x-2">
      {!isImage && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Color" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeActiveTool("fill")}
              size="icon"
              variant="ghost"
              className={cn(activeTool === "fill" && "bg-gray-100")}
            >
              <div
                className="rounded-sm size-4 border"
                style={{ backgroundColor: properties.fillColor }}
              />
            </Button>
          </Hint>
        </div>
      )}
      {!isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Stroke color" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeActiveTool("stroke-color")}
              size="icon"
              variant="ghost"
              className={cn(activeTool === "stroke-color" && "bg-gray-100")}
            >
              <div
                className="rounded-sm size-4 border-2 bg-white"
                style={{ borderColor: properties.strokeColor }}
              />
            </Button>
          </Hint>
        </div>
      )}
      {!isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Stroke width" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeActiveTool("stroke-width")}
              size="icon"
              variant="ghost"
              className={cn(activeTool === "stroke-width" && "bg-gray-100")}
            >
              <BsBorderWidth className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Font" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeActiveTool("font")}
              size="icon"
              variant="ghost"
              className={cn(
                "w-auto px-2 text-sm",
                activeTool === "font" && "bg-gray-100"
              )}
            >
              <div className="max-w-[100px] truncate">
                {properties.fontFamily}
              </div>
              <ChevronDown className="size-4 ml-2 shrink-0" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Bold" side="bottom" sideOffset={5}>
            <Button
              onClick={toggleBold}
              size="icon"
              variant="ghost"
              className={cn(properties.fontWeight > 500 && "bg-gray-100")}
            >
              <FaBold className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Italic" side="bottom" sideOffset={5}>
            <Button
              onClick={toggleItalic}
              size="icon"
              variant="ghost"
              className={cn(properties.fontStyle === "italic" && "bg-gray-100")}
            >
              <FaItalic className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Underline" side="bottom" sideOffset={5}>
            <Button
              onClick={toggleUnderline}
              size="icon"
              variant="ghost"
              className={cn(properties.fontUnderline && "bg-gray-100")}
            >
              <FaUnderline className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Strike" side="bottom" sideOffset={5}>
            <Button
              onClick={toggleLinethrough}
              size="icon"
              variant="ghost"
              className={cn(properties.fontLinethrough && "bg-gray-100")}
            >
              <FaStrikethrough className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Align left" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeTextAlign("left")}
              size="icon"
              variant="ghost"
              className={cn(properties.textAlign === "left" && "bg-gray-100")}
            >
              <AlignLeft className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Align center" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeTextAlign("center")}
              size="icon"
              variant="ghost"
              className={cn(properties.textAlign === "center" && "bg-gray-100")}
            >
              <AlignCenter className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Align right" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeTextAlign("right")}
              size="icon"
              variant="ghost"
              className={cn(properties.textAlign === "right" && "bg-gray-100")}
            >
              <AlignRight className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isText && (
        <div className="flex items-center h-full justify-center">
          <FontSizeInput
            value={properties.fontSize}
            onChange={onChangeFontSize}
          />
          <div className="flex items-center h-full justify-center">
            <Hint label="Espacamento" side="bottom" sideOffset={5}>
              <Button
                onClick={() => onChangeActiveTool("font-spacing")}
                size="icon"
                variant="ghost"
                className={cn(activeTool === "font-spacing" && "bg-gray-100")}
              >
                <MoveVertical className="size-4" />
              </Button>
            </Hint>
          </div>
        </div>
      )}
      {isImage && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Filters" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeActiveTool("filter")}
              size="icon"
              variant="ghost"
              className={cn(activeTool === "filter" && "bg-gray-100")}
            >
              <TbColorFilter className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isImage && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Cortar imagem" side="bottom" sideOffset={5}>
            <Button
              onClick={() => {
                editor?.startCrop(() => onChangeActiveTool("select"));
                onChangeActiveTool("crop");
              }}
              size="icon"
              variant="ghost"
            >
              <Crop className="size-4" />
            </Button>
          </Hint>
        </div>
      )}
      {isImage && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Remove background" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeActiveTool("remove-bg")}
              size="icon"
              variant="ghost"
              className={cn(activeTool === "remove-bg" && "bg-gray-100")}
            >
              <SquareSplitHorizontal className="size-4" />
            </Button>
          </Hint>
        </div>
      )}

      {isRectangle && (
        <div className="flex items-center h-full justify-center">
          <Hint label="Cantos arredondados" side="bottom" sideOffset={5}>
            <Button
              onClick={() => onChangeActiveTool("corner-radius")}
              size="icon"
              variant="ghost"
              className={cn(activeTool === "corner-radius" && "bg-gray-100")}
            >
              <Spline className="size-4" />
            </Button>
          </Hint>
        </div>
      )}

      <div className="flex items-center h-full justify-center">
        <Hint label="Bring forward" side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.bringForward()}
            size="icon"
            variant="ghost"
          >
            <ArrowUp className="size-4" />
          </Button>
        </Hint>
      </div>
      <div className="flex items-center h-full justify-center">
        <Hint label="Send backwards" side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.sendBackwards()}
            size="icon"
            variant="ghost"
          >
            <ArrowDown className="size-4" />
          </Button>
        </Hint>
      </div>

      {/* GRUPO DE ALINHAMENTO */}
      <div className="h-6 w-px bg-slate-200 mx-1" />

      <div className="flex items-center h-full justify-center">
        <Hint label={`Alinhar esquerda (${alignTargetLabel})`} side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.alignLeft()}
            size="icon"
            variant="ghost"
          >
            <AlignStartVertical className="size-4" />
          </Button>
        </Hint>
      </div>
      <div className="flex items-center h-full justify-center">
        <Hint label={`Centralizar horizontal (${alignTargetLabel})`} side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.alignCenterX()}
            size="icon"
            variant="ghost"
          >
            <AlignCenterVertical className="size-4" />
          </Button>
        </Hint>
      </div>
      <div className="flex items-center h-full justify-center">
        <Hint label={`Alinhar direita (${alignTargetLabel})`} side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.alignRight()}
            size="icon"
            variant="ghost"
          >
            <AlignEndVertical className="size-4" />
          </Button>
        </Hint>
      </div>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      <div className="flex items-center h-full justify-center">
        <Hint label={`Alinhar topo (${alignTargetLabel})`} side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.alignTop()}
            size="icon"
            variant="ghost"
          >
            <AlignStartHorizontal className="size-4" />
          </Button>
        </Hint>
      </div>
      <div className="flex items-center h-full justify-center">
        <Hint label={`Centralizar vertical (${alignTargetLabel})`} side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.alignCenterY()}
            size="icon"
            variant="ghost"
          >
            <AlignCenterHorizontal className="size-4" />
          </Button>
        </Hint>
      </div>
      <div className="flex items-center h-full justify-center">
        <Hint label={`Alinhar base (${alignTargetLabel})`} side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.alignBottom()}
            size="icon"
            variant="ghost"
          >
            <AlignEndHorizontal className="size-4" />
          </Button>
        </Hint>
      </div>

      <div className="h-6 w-px bg-slate-200 mx-1" />
            

      {(() => {
        // Regra: admin sempre ve; user/vendedor so em elemento editavel
        const role = brandSettings?.userRole;
        const isSellerRole = role === "user" || role === "dealership_admin";
        // @ts-ignore - propriedade custom
        const elementIsEditable = selectedObject?.get && selectedObject.get("isEditable") === true;
        const showShadow = !isSellerRole || elementIsEditable;

        if (!showShadow) return null;

        return (
          <div className="flex items-center h-full justify-center">
            <Hint label="Sombra" side="bottom" sideOffset={5}>
              <Button
                onClick={() => onChangeActiveTool("shadow")}
                size="icon"
                variant="ghost"
                className={cn(activeTool === "shadow" && "bg-gray-100")}
              >
                <SquareStack className="size-4" />
              </Button>
            </Hint>
          </div>
        );
      })()}  

      <div className="flex items-center h-full justify-center">
        <Hint label="Opacity" side="bottom" sideOffset={5}>
          <Button
            onClick={() => onChangeActiveTool("opacity")}
            size="icon"
            variant="ghost"
            className={cn(activeTool === "opacity" && "bg-gray-100")}
          >
            <RxTransparencyGrid className="size-4" />
          </Button>
        </Hint>
      </div>
      <div className="flex items-center h-full justify-center">
        <Hint label="Duplicate" side="bottom" sideOffset={5}>
          <Button
            onClick={() => {
              editor?.onCopy();
              editor?.onPaste();
            }}
            size="icon"
            variant="ghost"
          >
            <Copy className="size-4" />
          </Button>
        </Hint>
      </div>
      <div className="flex items-center h-full justify-center">
        <Hint label="Delete" side="bottom" sideOffset={5}>
          <Button
            onClick={() => editor?.delete()}
            size="icon"
            variant="ghost"
            className="text-red-600"
          >
            <Trash className="size-4" />
          </Button>
        </Hint>
      </div>

      {/* BOTAO DE BLOQUEIO / EDITAVEL - so brand_admin com toggle ligado ou em template */}
      {canToggleEditable && (
        <div className="flex items-center h-full justify-center ml-auto pl-2 border-l">
          <Hint
            label={
              properties.isEditable
                ? "Vendedor PODE editar"
                : "Vendedor NAO pode editar"
            }
            side="bottom"
            sideOffset={5}
          >
            <Button
              onClick={handleToggleEditable}
              size="sm"
              variant={properties.isEditable ? "default" : "outline"}
              className={cn(
                "gap-2",
                properties.isEditable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "text-slate-600"
              )}
            >
              {properties.isEditable ? (
                <>
                  <Unlock className="size-4" />
                  Editavel
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  Travado
                </>
              )}
            </Button>
          </Hint>
        </div>
      )}
    </div>
  );
};