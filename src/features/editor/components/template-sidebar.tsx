import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, Loader, Crown, MoreHorizontal, Trash, Pencil } from "lucide-react";

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

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";

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

  const { data: brandSettings } = useGetBrandSettings();

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

  const canManageTemplate = (template: ResponseType["data"][0]): boolean => {
    if (!brandSettings) return false;

    const role = brandSettings.userRole;
    const isAdmin = role === "brand_admin" || role === "super_admin";
    // @ts-ignore
    const visibility = template.templateVisibility;

    if (isAdmin) return true;

    // @ts-ignore - userId existe no endpoint
    if (visibility === "personal" && template.userId === brandSettings.userId) {
      return true;
    }

    return false;
  };

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
          <div className="grid grid-cols-2 gap-4">
            {data && data.map(function (template) {
              const showManage = canManageTemplate(template);

              return (
                <div
                  key={template.id}
                  style={{
                    aspectRatio: `${template.width}/${template.height}`,
                  }}
                  className="relative w-full group bg-muted rounded-sm overflow-hidden border"
                >
                  <button
                    type="button"
                    onClick={function () { onClick(template); }}
                    disabled={
                      duplicateFromTemplate.isPending ||
                      removeMutation.isPending ||
                      renameMutation.isPending
                    }
                    className="absolute inset-0 w-full h-full hover:opacity-75 transition disabled:opacity-50"
                  >
                    <Image
                      fill
                      src={template.thumbnailUrl || ""}
                      alt={template.name || "Template"}
                      className="object-cover"
                    />
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