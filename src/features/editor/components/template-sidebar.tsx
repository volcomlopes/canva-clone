import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, Loader, Crown, MoreHorizontal, Trash, Pencil, FolderInput, Check, Plus } from "lucide-react";

import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

import {
  ActiveTool,
  Editor,
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { ResponseType, useGetTemplates } from "@/features/projects/api/use-get-templates";
import { useDuplicateFromTemplate } from "@/features/projects/api/use-duplicate-from-template";
import { useDeleteProject } from "@/features/projects/api/use-delete-project";
import { useRenameTemplate } from "@/features/projects/api/use-rename-template";
import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

import { useGetTemplateCategories } from "@/features/template-categories/api/use-get-template-categories";
import { useCreateTemplateCategory } from "@/features/template-categories/api/use-create-template-category";
import { useMoveTemplate } from "@/features/template-categories/api/use-move-template";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";

const UNCATEGORIZED = "__uncategorized__";
const ALL = "__all__";

interface TemplateSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

export const TemplateSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: TemplateSidebarProps) => {
  const router = useRouter();
  const { shouldBlock, triggerPaywall } = usePaywall();
  const duplicateFromTemplate = useDuplicateFromTemplate();
  const removeMutation = useDeleteProject();
  const renameMutation = useRenameTemplate();
  const moveTemplate = useMoveTemplate();

  const { data: brandSettings } = useGetBrandSettings();
  const { data: categories } = useGetTemplateCategories();
  const createCategory = useCreateTemplateCategory();

  const [selectedFolder, setSelectedFolder] = useState<string>(ALL);

  const [ConfirmOpenDialog, confirmOpen] = useConfirm(
    "Usar este template?",
    "Sera criado um novo projeto baseado nesse template. Voce podera edita-lo livremente."
  );

  const [ConfirmDeleteDialog, confirmDelete] = useConfirm(
    "Tem certeza?",
    "Esse template sera permanentemente removido da galeria."
  );

  const { data, isLoading, isError } = useGetTemplates({
    limit: "20",
    page: "1",
  });

  const role = brandSettings?.userRole;
  const isAdmin = role === "brand_admin" || role === "super_admin";

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onClick = async (template: ResponseType["data"][0]) => {
    if (template.isPro && shouldBlock) {
      triggerPaywall();
      return;
    }

    const ok = await confirmOpen();
    if (!ok) return;

    duplicateFromTemplate.mutate(template.id, {
      onSuccess: function (response) {
        const newProjectId = response.data.id;
        router.push(`/editor/${newProjectId}`);
      },
    });
  };

  const onDelete = async (templateId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;

    removeMutation.mutate({ id: templateId });
  };

  const onRename = (template: ResponseType["data"][0]) => {
    const newName = window.prompt("Novo nome do template:", template.name);
    if (!newName) return;

    const trimmed = newName.trim();
    if (trimmed.length === 0) return;
    if (trimmed === template.name) return;

    renameMutation.mutate({ id: template.id, name: trimmed });
  };

  const onMove = (templateId: string, categoryId: string | null) => {
    moveTemplate.mutate({ templateId, categoryId });
  };

  const onCreateFolder = () => {
    const name = window.prompt("Nome da nova pasta:");
    if (!name) return;

    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    createCategory.mutate(trimmed, {
      onSuccess: function (created) {
        if (created?.id) {
          setSelectedFolder(created.id);
        }
      },
    });
  };

  const canManageTemplate = (template: ResponseType["data"][0]): boolean => {
    if (!brandSettings) return false;

    // @ts-ignore
    const visibility = template.templateVisibility;

    if (isAdmin) return true;

    // @ts-ignore - userId existe no endpoint
    if (visibility === "personal" && template.userId === brandSettings.userId) {
      return true;
    }

    return false;
  };

  const filteredData = (data || []).filter((template) => {
    if (selectedFolder === ALL) return true;
    // @ts-ignore - templateCategoryId vem do endpoint
    const catId = template.templateCategoryId || null;
    if (selectedFolder === UNCATEGORIZED) return catId === null;
    return catId === selectedFolder;
  });

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "templates" ? "visible" : "hidden",
      )}
    >
      <ConfirmOpenDialog />
      <ConfirmDeleteDialog />
      <ToolSidebarHeader
        title="Templates"
        description="Escolha um template para comecar"
      />

      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Select
            value={selectedFolder}
            onValueChange={setSelectedFolder}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
              <SelectItem value={UNCATEGORIZED}>Sem categoria</SelectItem>
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 shrink-0"
              title="Nova pasta"
              onClick={onCreateFolder}
              disabled={createCategory.isPending}
            >
              <Plus className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center flex-1">
          <Loader className="size-4 text-muted-foreground animate-spin" />
        </div>
      )}
      {isError && (
        <div className="flex flex-col gap-y-4 items-center justify-center flex-1">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">
            Erro ao carregar templates
          </p>
        </div>
      )}
      <ScrollArea>
        <div className="p-4">
          {!isLoading && !isError && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-muted-foreground text-xs">
                Nenhum template nesta pasta
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {filteredData.map(function (template) {
              const showManage = canManageTemplate(template);
              // @ts-ignore - templateCategoryId vem do endpoint
              const currentCat = template.templateCategoryId || null;

              return (
                <div
                  key={template.id}
                  className="relative w-full group bg-slate-100 rounded-sm overflow-hidden border aspect-[3/4]"
                >
                  <button
                    type="button"
                    onClick={function () { onClick(template); }}
                    disabled={
                      duplicateFromTemplate.isPending ||
                      removeMutation.isPending ||
                      renameMutation.isPending ||
                      moveTemplate.isPending
                    }
                    className="absolute inset-0 w-full h-full flex items-center justify-center hover:opacity-75 transition disabled:opacity-50"
                  >
                    {template.thumbnailUrl ? (
                      <Image
                        fill
                        src={template.thumbnailUrl}
                        alt={template.name || "Template"}
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 text-[10px]">
                        Sem preview
                      </div>
                    )}
                    {template.isPro && (
                      <div className="absolute top-2 right-2 size-8 items-center flex justify-center bg-black/50 rounded-full pointer-events-none">
                        <Crown className="size-4 fill-yellow-500 text-yellow-500" />
                      </div>
                    )}
                    <div
                      className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white p-1 bg-black/50 text-left"
                    >
                      {template.name}
                    </div>
                  </button>

                  {showManage && (
                    <div
                      className="absolute top-1 left-1 z-10"
                      onClick={function (e) { e.stopPropagation(); }}
                    >
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 bg-black/60 hover:bg-black/80 text-white"
                          >
                            <MoreHorizontal className="size-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={function () { onRename(template); }}
                          >
                            <Pencil className="size-4 mr-2" />
                            Renomear
                          </DropdownMenuItem>

                          {isAdmin && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="cursor-pointer">
                                <FolderInput className="size-4 mr-2" />
                                Mover para pasta
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent className="w-52">
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={function () { onMove(template.id, null); }}
                                  >
                                    {currentCat == null && (
                                      <Check className="size-4 mr-2" />
                                    )}
                                    <span className={currentCat == null ? "" : "ml-6"}>
                                      Sem categoria
                                    </span>
                                  </DropdownMenuItem>

                                  {categories && categories.length > 0 && (
                                    <DropdownMenuSeparator />
                                  )}

                                  {categories?.map((cat) => {
                                    const active = currentCat === cat.id;
                                    return (
                                      <DropdownMenuItem
                                        key={cat.id}
                                        className="cursor-pointer"
                                        onClick={function () { onMove(template.id, cat.id); }}
                                      >
                                        {active && <Check className="size-4 mr-2" />}
                                        <span className={active ? "truncate" : "ml-6 truncate"}>
                                          {cat.name}
                                        </span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                          )}

                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={function () { onDelete(template.id); }}
                          >
                            <Trash className="size-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};