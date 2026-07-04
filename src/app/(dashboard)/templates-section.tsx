"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, TriangleAlert, ChevronDown, Plus, Folder, FolderMinus, Layers, MoreVertical, Pencil, Trash } from "lucide-react";

import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

import { ResponseType, useGetTemplates } from "@/features/projects/api/use-get-templates";
import { useDuplicateFromTemplate } from "@/features/projects/api/use-duplicate-from-template";
import { useDeleteProject } from "@/features/projects/api/use-delete-project";
import { useRenameTemplate } from "@/features/projects/api/use-rename-template";
import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

import { useGetTemplateCategories } from "@/features/template-categories/api/use-get-template-categories";
import { useCreateTemplateCategory } from "@/features/template-categories/api/use-create-template-category";
import { useMoveTemplate } from "@/features/template-categories/api/use-move-template";
import { useRenameTemplateCategory } from "@/features/template-categories/api/use-rename-template-category";
import { useDeleteTemplateCategory } from "@/features/template-categories/api/use-delete-template-category";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";

import { TemplateCard } from "./template-card";

const INITIAL_LIMIT = 12;
const LOAD_MORE_STEP = 12;

const UNCATEGORIZED = "__uncategorized__";
const ALL = "__all__";

export const TemplatesSection = () => {
  const { shouldBlock, triggerPaywall } = usePaywall();
  const router = useRouter();
  const duplicateFromTemplate = useDuplicateFromTemplate();
  const removeMutation = useDeleteProject();
  const renameMutation = useRenameTemplate();

  const { data: brandSettings } = useGetBrandSettings();

  const { data: categories } = useGetTemplateCategories();
  const createCategory = useCreateTemplateCategory();
  const moveTemplate = useMoveTemplate();
  const renameCategory = useRenameTemplateCategory();
  const deleteCategory = useDeleteTemplateCategory();

  const [ConfirmDialog, confirm] = useConfirm(
    "Tem certeza?",
    "Esse template sera permanentemente removido da galeria."
  );

  const [ConfirmDeleteFolder, confirmDeleteFolder] = useConfirm(
    "Excluir esta pasta?",
    "Os templates dentro dela NAO serao apagados - eles voltam para 'Sem categoria'. Apenas a pasta e removida."
  );

  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [selectedFolder, setSelectedFolder] = useState<string>(ALL);

  const {
    data,
    isLoading,
    isError
  } = useGetTemplates({ page: "1", limit: String(limit) });

  const role = brandSettings?.userRole;
  const isAdmin = role === "brand_admin" || role === "super_admin";

  const onClick = (template: ResponseType["data"][0]) => {
    if (template.isPro && shouldBlock) {
      triggerPaywall();
      return;
    }

    duplicateFromTemplate.mutate(template.id, {
      onSuccess: function (response) {
        router.push(`/editor/${response.data.id}`);
      },
    });
  };

  const onDelete = async (templateId: string) => {
    const ok = await confirm();
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

  const onCreateFolder = () => {
    const name = window.prompt("Nome da nova pasta:");
    if (!name) return;

    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    createCategory.mutate(trimmed);
  };

  const onMove = (templateId: string, categoryId: string | null) => {
    moveTemplate.mutate({ templateId, categoryId });
  };

  const onRenameFolder = (folderId: string, currentName: string) => {
    const newName = window.prompt("Novo nome da pasta:", currentName);
    if (!newName) return;

    const trimmed = newName.trim();
    if (trimmed.length === 0) return;
    if (trimmed === currentName) return;

    renameCategory.mutate({ id: folderId, name: trimmed });
  };

  const onDeleteFolder = async (folderId: string) => {
    const ok = await confirmDeleteFolder();
    if (!ok) return;

    if (selectedFolder === folderId) {
      setSelectedFolder(ALL);
    }

    deleteCategory.mutate(folderId);
  };

  const handleLoadMore = () => {
    setLimit(function (current) {
      return current + LOAD_MORE_STEP;
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

  const countFor = (folderId: string): number => {
    return (data || []).filter((template) => {
      // @ts-ignore
      const catId = template.templateCategoryId || null;
      if (folderId === ALL) return true;
      if (folderId === UNCATEGORIZED) return catId === null;
      return catId === folderId;
    }).length;
  };

  const hasMore = data && data.length === limit;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Comece com um template
        </h3>
        <div className="flex items-center justify-center h-32">
          <Loader className="size-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Comece com um template
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <TriangleAlert className="size-6 text-muted-foreground" />
          <p>Erro ao carregar templates</p>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return null;
  }

  const folderItemClass = (active: boolean) =>
    cn(
      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left group/folder",
      active
        ? "bg-white border border-slate-200 font-medium text-slate-900"
        : "text-slate-600 hover:bg-slate-100"
    );

  const folderList = (categories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  return (
    <div>
      <ConfirmDialog />
      <ConfirmDeleteFolder />
      <h3 className="font-semibold text-lg mb-4">
        Comece com um template
      </h3>

      <div className="flex gap-6">
        <aside className="w-48 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">
              Pastas
            </span>
            {isAdmin && (
              <button
                onClick={onCreateFolder}
                disabled={createCategory.isPending}
                className="text-slate-400 hover:text-slate-700 transition-colors"
                title="Nova pasta"
                type="button"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setSelectedFolder(ALL)}
              className={folderItemClass(selectedFolder === ALL)}
            >
              <Layers className="size-4" />
              <span className="flex-1">Todos</span>
              <span className="text-xs text-slate-400">{countFor(ALL)}</span>
            </button>

            {categories?.map((cat) => (
              <div
                key={cat.id}
                className={folderItemClass(selectedFolder === cat.id)}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFolder(cat.id)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <Folder className="size-4 shrink-0" />
                  <span className="flex-1 truncate text-left">{cat.name}</span>
                </button>

                <span className="text-xs text-slate-400 w-4 text-right">
                  {countFor(cat.id)}
                </span>

                {isAdmin && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-700 opacity-0 group-hover/folder:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onRenameFolder(cat.id, cat.name)}
                      >
                        <Pencil className="size-4 mr-2" />
                        Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={() => onDeleteFolder(cat.id)}
                      >
                        <Trash className="size-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSelectedFolder(UNCATEGORIZED)}
              className={folderItemClass(selectedFolder === UNCATEGORIZED)}
            >
              <FolderMinus className="size-4" />
              <span className="flex-1">Sem categoria</span>
              <span className="text-xs text-slate-400">{countFor(UNCATEGORIZED)}</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center border border-dashed border-slate-200 rounded-lg">
              <FolderMinus className="size-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                Nenhum template nesta pasta ainda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredData.map((template) => (
                <TemplateCard
                  key={template.id}
                  title={template.name}
                  imageSrc={template.thumbnailUrl || ""}
                  onClick={() => onClick(template)}
                  disabled={
                    duplicateFromTemplate.isPending ||
                    removeMutation.isPending ||
                    renameMutation.isPending ||
                    moveTemplate.isPending
                  }
                  description={`${template.width} x ${template.height} px`}
                  width={template.width}
                  height={template.height}
                  isPro={template.isPro}
                  canManage={canManageTemplate(template)}
                  onDelete={() => onDelete(template.id)}
                  onRename={() => onRename(template)}
                  folders={isAdmin ? folderList : undefined}
                  // @ts-ignore - templateCategoryId vem do endpoint
                  currentCategoryId={template.templateCategoryId || null}
                  onMove={
                    isAdmin
                      ? (categoryId) => onMove(template.id, categoryId)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={duplicateFromTemplate.isPending}
              >
                <ChevronDown className="size-4 mr-2" />
                Ver mais templates
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};