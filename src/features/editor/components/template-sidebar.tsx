import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, Loader, Crown } from "lucide-react";

import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

import {
  ActiveTool,
  Editor,
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { ResponseType, useGetTemplates } from "@/features/projects/api/use-get-templates";
import { useDuplicateFromTemplate } from "@/features/projects/api/use-duplicate-from-template";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const [ConfirmDialog, confirm] = useConfirm(
    "Usar este template?",
    "Sera criado um novo projeto baseado nesse template. Voce podera edita-lo livremente."
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

    const ok = await confirm();
    if (!ok) return;

    duplicateFromTemplate.mutate(template.id, {
      onSuccess: function (response) {
        const newProjectId = response.data.id;
        router.push(`/editor/${newProjectId}`);
      },
    });
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "templates" ? "visible" : "hidden",
      )}
    >
      <ConfirmDialog />
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
              return (
                <button
                  style={{
                    aspectRatio: `${template.width}/${template.height}`,
                  }}
                  onClick={function () { onClick(template); }}
                  key={template.id}
                  disabled={duplicateFromTemplate.isPending}
                  className="relative w-full group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border disabled:opacity-50"
                >
                  <Image
                    fill
                    src={template.thumbnailUrl || ""}
                    alt={template.name || "Template"}
                    className="object-cover"
                  />
                  {template.isPro && (
                    <div className="absolute top-2 right-2 size-8 items-center flex justify-center bg-black/50 rounded-full">
                      <Crown className="size-4 fill-yellow-500 text-yellow-500" />
                    </div>
                  )}
                  <div
                    className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white p-1 bg-black/50 text-left"
                  >
                    {template.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};