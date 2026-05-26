"use client";

import { useState } from "react";
import { CiFileOn } from "react-icons/ci";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { useFilePicker } from "use-file-picker";
import { useMutationState } from "@tanstack/react-query";
import {
  ChevronDown,
  Download,
  Loader,
  MousePointerClick,
  Redo2,
  Undo2,
  BookmarkPlus,
  RefreshCw,
  Plus,
} from "lucide-react";

import { UserButton } from "@/features/auth/components/user-button";

import { ActiveTool, Editor } from "@/features/editor/types";
import { Logo } from "@/features/editor/components/logo";

import { useSaveAsTemplate } from "@/features/projects/api/use-save-as-template";
import { useGetProject } from "@/features/projects/api/use-get-project";

import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  id: string;
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

type ModalView = "choice" | "name";

export const Navbar = ({
  id,
  editor,
  activeTool,
  onChangeActiveTool,
}: NavbarProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState("choice" as ModalView);
  const [templateName, setTemplateName] = useState("");

  const { data: project } = useGetProject(id);

  const data = useMutationState({
    filters: {
      mutationKey: ["project", { id }],
      exact: true,
    },
    select: (mutation) => mutation.state.status,
  });

  const currentStatus = data[data.length - 1];
  const isError = currentStatus === "error";
  const isPending = currentStatus === "pending";

  const saveAsTemplate = useSaveAsTemplate(id);

  const { openFilePicker } = useFilePicker({
    accept: ".json",
    onFilesSuccessfullySelected: ({ plainFiles }: any) => {
      if (plainFiles && plainFiles.length > 0) {
        const file = plainFiles[0];
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = () => {
          editor?.loadJson(reader.result as string);
        };
      }
    },
  });

  // @ts-ignore - campos novos no schema
  const childTemplateId = project?.templateChildId as string | null | undefined;
  // @ts-ignore
  const sourceTemplateId = project?.sourceTemplateId as string | null | undefined;

  // Define qual template e o "vinculado" pra atualizar:
  // 1. Se este projeto JA gerou template (templateChildId) - usa esse
  // 2. Se este projeto VEIO de template (sourceTemplateId) - usa esse
  const linkedTemplateId = childTemplateId || sourceTemplateId;
  const hasLinkedTemplate = !!linkedTemplateId;

  const openTemplateModal = () => {
    if (hasLinkedTemplate) {
      setModalView("choice");
    } else {
      setModalView("name");
      setTemplateName("");
    }
    setModalOpen(true);
  };

  const handleUpdateExisting = () => {
    saveAsTemplate.mutate(
      {
        mode: "update",
        targetTemplateId: linkedTemplateId || undefined,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
        },
      }
    );
  };

  const handleGoToCreateNew = () => {
    const baseName = project?.name || "Sem nome";
    setTemplateName(`${baseName} 2`);
    setModalView("name");
  };

  const handleConfirmCreate = () => {
    const trimmed = templateName.trim();
    if (!trimmed) return;

    saveAsTemplate.mutate(
      { mode: "create", name: trimmed },
      {
        onSuccess: () => {
          setModalOpen(false);
          setTemplateName("");
        },
      }
    );
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTemplateName("");
    setModalView("choice");
  };

  // Texto contextual do botao de update
  const updateButtonLabel = childTemplateId
    ? "Atualizar template gerado deste projeto"
    : "Atualizar template de origem";

  const updateButtonDescription = childTemplateId
    ? "Substitui o template que voce salvou a partir deste projeto."
    : "Substitui o template original que deu origem a este projeto.";

  return (
    <>
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          {modalView === "choice" && (
            <>
              <DialogHeader>
                <DialogTitle>Salvar template</DialogTitle>
                <DialogDescription>
                  Este projeto ja esta vinculado a um template. O que voce quer fazer?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <button
                  type="button"
                  onClick={handleUpdateExisting}
                  disabled={saveAsTemplate.isPending}
                  className="w-full text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600 rounded-md">
                      <RefreshCw className="size-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {updateButtonLabel}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {updateButtonDescription}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleGoToCreateNew}
                  disabled={saveAsTemplate.isPending}
                  className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-4 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-md">
                      <Plus className="size-4 text-slate-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        Criar como NOVO template
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Gera outro template com nome diferente. Util pra criar variacoes.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}

          {modalView === "name" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {hasLinkedTemplate ? "Criar como novo template" : "Salvar como template"}
                </DialogTitle>
                <DialogDescription>
                  Esse template ficara disponivel na galeria.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <label htmlFor="template-name" className="text-sm font-medium">
                  Nome do template
                </label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Promo Acai Janeiro"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && templateName.trim()) {
                      handleConfirmCreate();
                    }
                  }}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {templateName.length}/100 caracteres
                </p>
              </div>

              <DialogFooter>
                {hasLinkedTemplate && (
                  <Button
                    variant="ghost"
                    onClick={() => setModalView("choice")}
                    disabled={saveAsTemplate.isPending}
                  >
                    Voltar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={saveAsTemplate.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmCreate}
                  disabled={!templateName.trim() || saveAsTemplate.isPending}
                >
                  {saveAsTemplate.isPending ? (
                    <>
                      <Loader className="size-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Template"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <nav className="w-full flex items-center p-4 h-[68px] gap-x-8 border-b lg:pl-[34px]">
        <Logo />
        <div className="w-full flex items-center gap-x-1 h-full">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                File
                <ChevronDown className="size-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-60">
              <DropdownMenuItem
                onClick={() => openFilePicker()}
                className="flex items-center gap-x-2"
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>Open</p>
                  <p className="text-xs text-muted-foreground">
                    Open a JSON file
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={openTemplateModal}
                className="flex items-center gap-x-2"
              >
                <BookmarkPlus className="size-8" />
                <div>
                  <p>Salvar como Template</p>
                  <p className="text-xs text-muted-foreground">
                    Salva como template
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-2" />
          <Hint label="Select" side="bottom" sideOffset={10}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChangeActiveTool("select")}
              className={cn(activeTool === "select" && "bg-gray-100")}
            >
              <MousePointerClick className="size-4" />
            </Button>
          </Hint>
          <Hint label="Undo" side="bottom" sideOffset={10}>
            <Button
              disabled={!editor?.canUndo()}
              variant="ghost"
              size="icon"
              onClick={() => editor?.onUndo()}
            >
              <Undo2 className="size-4" />
            </Button>
          </Hint>
          <Hint label="Redo" side="bottom" sideOffset={10}>
            <Button
              disabled={!editor?.canRedo()}
              variant="ghost"
              size="icon"
              onClick={() => editor?.onRedo()}
            >
              <Redo2 className="size-4" />
            </Button>
          </Hint>
          <Separator orientation="vertical" className="mx-2" />
          {isPending && (
            <div className="flex items-center gap-x-2">
              <Loader className="size-4 animate-spin text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                Saving...
              </div>
            </div>
          )}
          {!isPending && isError && (
            <div className="flex items-center gap-x-2">
              <BsCloudSlash className="size-[20px] text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                Failed to save
              </div>
            </div>
          )}
          {!isPending && !isError && (
            <div className="flex items-center gap-x-2">
              <BsCloudCheck className="size-[20px] text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                Saved
              </div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-x-4">
            <Hint
              label={hasLinkedTemplate ? "Atualizar/Criar Template" : "Salvar como Template"}
              side="bottom"
              sideOffset={10}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={openTemplateModal}
                disabled={saveAsTemplate.isPending}
              >
                {saveAsTemplate.isPending ? (
                  <Loader className="size-4 mr-2 animate-spin" />
                ) : hasLinkedTemplate ? (
                  <RefreshCw className="size-4 mr-2" />
                ) : (
                  <BookmarkPlus className="size-4 mr-2" />
                )}
                {hasLinkedTemplate ? "Atualizar Template" : "Salvar Template"}
              </Button>
            </Hint>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  Export
                  <Download className="size-4 ml-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-60">
                <DropdownMenuItem
                  className="flex items-center gap-x-2"
                  onClick={() => editor?.saveJson()}
                >
                  <CiFileOn className="size-8" />
                  <div>
                    <p>JSON</p>
                    <p className="text-xs text-muted-foreground">
                      Save for later editing
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-x-2"
                  onClick={() => editor?.savePng()}
                >
                  <CiFileOn className="size-8" />
                  <div>
                    <p>PNG</p>
                    <p className="text-xs text-muted-foreground">
                      Best for sharing on the web
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-x-2"
                  onClick={() => editor?.saveJpg()}
                >
                  <CiFileOn className="size-8" />
                  <div>
                    <p>JPG</p>
                    <p className="text-xs text-muted-foreground">
                      Best for printing
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-x-2"
                  onClick={() => editor?.saveSvg()}
                >
                  <CiFileOn className="size-8" />
                  <div>
                    <p>SVG</p>
                    <p className="text-xs text-muted-foreground">
                      Best for editing in vector software
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <UserButton />
          </div>
        </div>
      </nav>
    </>
  );
};