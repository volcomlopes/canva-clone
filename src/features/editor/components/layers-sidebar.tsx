"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Pencil,
  GripVertical,
  MoreVertical,
  Trash,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayersSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

interface LayerItem {
  id: string;
  obj: fabric.Object;
  type: string;
  label: string;
  visible: boolean;
  isEditable: boolean;
}

const getLayerInfo = (obj: fabric.Object, index: number): LayerItem => {
  const type = obj.type || "object";
  let label = "Elemento";

  // @ts-ignore - propriedade custom
  const isEditable = obj.get && obj.get("isEditable") === true;

  if (type === "i-text" || type === "textbox") {
    // @ts-ignore - text existe em IText/Textbox
    const text = (obj.text as string) || "";
    label = text.length > 20 ? text.substring(0, 20) + "..." : text || "Texto";
  } else if (type === "image") {
    label = "Imagem";
  } else if (type === "rect") {
    label = "Retangulo";
  } else if (type === "circle") {
    label = "Circulo";
  } else if (type === "triangle") {
    label = "Triangulo";
  } else if (type === "polygon") {
    label = "Poligono";
  } else if (type === "path") {
    label = "Desenho";
  } else if (type === "group") {
    label = "Grupo";
  }

  return {
    // @ts-ignore - id pode nao existir, criamos baseado no index
    id: ((obj as any).id as string) || `layer-${index}`,
    obj,
    type,
    label,
    visible: obj.visible !== false,
    isEditable,
  };
};

const getLayerIcon = (type: string) => {
  if (type === "i-text" || type === "textbox") return Type;
  if (type === "image") return ImageIcon;
  if (type === "rect") return Square;
  if (type === "circle") return Circle;
  if (type === "triangle") return Triangle;
  if (type === "polygon") return Hexagon;
  if (type === "path") return Pencil;
  return Layers;
};

interface SortableLayerItemProps {
  layer: LayerItem;
  isActive: boolean;
  canManage: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const SortableLayerItem = ({
  layer,
  isActive,
  canManage,
  onSelect,
  onToggleVisibility,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SortableLayerItemProps) => {
  const Icon = getLayerIcon(layer.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id, disabled: !canManage });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 rounded border transition-colors",
        isActive
          ? "bg-blue-50 border-blue-300"
          : "bg-white border-slate-200 hover:bg-slate-50",
        !layer.visible && "opacity-50"
      )}
    >
      {/* Drag handle - so se pode gerenciar */}
      {canManage ? (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-slate-400 hover:text-slate-600"
          type="button"
        >
          <GripVertical className="size-4" />
        </button>
      ) : (
        <div className="w-4" />
      )}

      {/* Conteudo clicavel - seleciona o elemento */}
      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <Icon className="size-4 shrink-0 text-slate-600" />
        <span className="text-xs truncate flex-1">{layer.label}</span>
        {layer.isEditable && (
          <span
            className="text-[10px] px-1 rounded bg-blue-100 text-blue-700"
            title="Vendedor pode editar"
          >
            E
          </span>
        )}
      </button>

      {/* Botao olho - mostrar/esconder */}
      <button
        type="button"
        onClick={onToggleVisibility}
        className="text-slate-500 hover:text-slate-900"
        title={layer.visible ? "Esconder" : "Mostrar"}
      >
        {layer.visible ? (
          <Eye className="size-4" />
        ) : (
          <EyeOff className="size-4" />
        )}
      </button>

      {/* Menu de acoes - so se pode gerenciar */}
      {canManage && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="text-slate-500 hover:text-slate-900" type="button">
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onMoveUp} className="cursor-pointer">
              <ArrowUp className="size-4 mr-2" />
              Mover para frente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveDown} className="cursor-pointer">
              <ArrowDown className="size-4 mr-2" />
              Mover para tras
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash className="size-4 mr-2" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export const LayersSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: LayersSidebarProps) => {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: brandSettings } = useGetBrandSettings();
  const userRole = brandSettings?.userRole;
  const isAdmin = userRole === "brand_admin" || userRole === "super_admin";
  const isSeller = userRole === "user" || userRole === "dealership_admin";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Atualiza lista de layers quando o canvas muda
  useEffect(() => {
    if (!editor?.canvas) return;
    if (activeTool !== "layers") return;

    const canvas = editor.canvas;

    const refresh = function () {
      const objects = canvas.getObjects().filter(function (obj) {
        return obj.name !== "clip";
      });

      // Garante que cada objeto tem id pra drag and drop
      objects.forEach(function (obj, index) {
        // @ts-ignore - id e custom
        if (!obj.id) {
          // @ts-ignore
          obj.id = `layer-${Date.now()}-${index}`;
        }
      });

      // Inverte pra exibir topo = frente
      const items = objects
        .map(function (obj, index) {
          return getLayerInfo(obj, index);
        })
        .reverse();

      setLayers(items);

      const active = canvas.getActiveObject();
      // @ts-ignore - id custom
      setActiveId(active ? ((active.id as string) || null) : null);
    };

    refresh();

    canvas.on("object:added", refresh);
    canvas.on("object:removed", refresh);
    canvas.on("object:modified", refresh);
    canvas.on("selection:created", refresh);
    canvas.on("selection:updated", refresh);
    canvas.on("selection:cleared", refresh);
    canvas.on("after:render", refresh);

    return function () {
      canvas.off("object:added", refresh);
      canvas.off("object:removed", refresh);
      canvas.off("object:modified", refresh);
      canvas.off("selection:created", refresh);
      canvas.off("selection:updated", refresh);
      canvas.off("selection:cleared", refresh);
      canvas.off("after:render", refresh);
    };
  }, [editor, activeTool]);

  const canManageLayer = (layer: LayerItem): boolean => {
    if (isAdmin) return true;
    if (isSeller) return layer.isEditable;
    return false;
  };

  const onSelect = (layer: LayerItem) => {
    if (!editor?.canvas) return;
    editor.canvas.setActiveObject(layer.obj);
    editor.canvas.requestRenderAll();
  };

  const onToggleVisibility = (layer: LayerItem) => {
    layer.obj.set({ visible: !layer.visible });
    editor?.canvas.requestRenderAll();
    // Dispara object:modified pra acionar o auto-save
    editor?.canvas.fire("object:modified", { target: layer.obj });
  };

  const onDelete = (layer: LayerItem) => {
    if (!editor?.canvas) return;
    editor.canvas.remove(layer.obj);
    editor.canvas.requestRenderAll();
  };

  const onMoveUp = (layer: LayerItem) => {
    if (!editor?.canvas) return;
    editor.canvas.bringForward(layer.obj);
    editor.canvas.requestRenderAll();
  };

  const onMoveDown = (layer: LayerItem) => {
    if (!editor?.canvas) return;
    editor.canvas.sendBackwards(layer.obj);
    editor.canvas.requestRenderAll();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!editor?.canvas) return;

    const canvas = editor.canvas;

    // Encontra os indices no array exibido
    const displayOldIndex = layers.findIndex(function (l) { return l.id === active.id; });
    const displayNewIndex = layers.findIndex(function (l) { return l.id === over.id; });

    if (displayOldIndex === -1 || displayNewIndex === -1) return;

    // Reordena visualmente
    const newLayers = arrayMove(layers, displayOldIndex, displayNewIndex);
    setLayers(newLayers);

    // Atualiza o canvas real
    // Lembrar: a lista esta INVERTIDA (topo = frente)
    // Pegamos o objeto movido e usamos moveTo no canvas
    const movedLayer = layers[displayOldIndex];
    const objects = canvas.getObjects().filter(function (obj) {
      return obj.name !== "clip";
    });

    // Novo indice no canvas (REAL, nao invertido)
    // Posicao no canvas = total - 1 - displayIndex (pra inverter)
    const newCanvasIndex = objects.length - 1 - displayNewIndex;

    canvas.moveTo(movedLayer.obj, newCanvasIndex);

    // Workspace (clip) sempre fica atras
    const workspace = canvas.getObjects().find(function (o) { return o.name === "clip"; });
    workspace?.sendToBack();

    canvas.requestRenderAll();

    // Dispara object:modified pra acionar o auto-save
    canvas.fire("object:modified", { target: movedLayer.obj });
  };

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "layers" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Camadas"
        description="Gerencie as camadas do projeto"
      />

      <ScrollArea>
        <div className="p-3 space-y-1">
          {layers.length === 0 && (
            <div className="text-center py-8">
              <Layers className="size-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">
                Nenhuma camada ainda
              </p>
            </div>
          )}

          {layers.length > 0 && (
            <>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide px-1 mb-1">
                Frente
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={layers.map(function (l) { return l.id; })}
                  strategy={verticalListSortingStrategy}
                >
                  {layers.map((layer) => (
                    <SortableLayerItem
                      key={layer.id}
                      layer={layer}
                      isActive={layer.id === activeId}
                      canManage={canManageLayer(layer)}
                      onSelect={() => onSelect(layer)}
                      onToggleVisibility={() => onToggleVisibility(layer)}
                      onDelete={() => onDelete(layer)}
                      onMoveUp={() => onMoveUp(layer)}
                      onMoveDown={() => onMoveDown(layer)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <p className="text-[10px] text-slate-400 uppercase tracking-wide px-1 mt-2">
                Fundo
              </p>
            </>
          )}
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};