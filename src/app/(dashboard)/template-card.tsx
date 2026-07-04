"use client";

import Image from "next/image";
import { Crown, MoreHorizontal, Trash, Pencil, FolderInput, Check } from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface TemplateFolder {
  id: string;
  name: string;
};

interface TemplateCardProps {
  imageSrc: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  description: string;
  width: number;
  height: number;
  isPro: boolean | null;
  canManage?: boolean;
  onDelete?: () => void;
  onRename?: () => void;
  folders?: TemplateFolder[];
  currentCategoryId?: string | null;
  onMove?: (categoryId: string | null) => void;
};

export const TemplateCard = ({
  imageSrc,
  title,
  onClick,
  disabled,
  description,
  height,
  width,
  isPro,
  canManage,
  onDelete,
  onRename,
  folders,
  currentCategoryId,
  onMove,
}: TemplateCardProps) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename?.();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMoveClick = (e: React.MouseEvent, categoryId: string | null) => {
    e.stopPropagation();
    onMove?.(categoryId);
  };

  const showMove = !!onMove;

  return (
    <div
      className={cn(
        "space-y-2 group text-left transition flex flex-col relative",
        disabled ? "cursor-not-allowed opacity-75" : ""
      )}
    >
      <div className="relative rounded-xl w-full overflow-hidden border bg-slate-100 aspect-[3/4]">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "absolute inset-0 w-full h-full flex items-center justify-center",
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          )}
        >
          {imageSrc ? (
            <Image
              fill
              src={imageSrc}
              alt={title}
              className="object-contain transition transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs">
              Sem preview
            </div>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl backdrop-filter backdrop-blur-sm">
            <p className="text-white font-medium">
              Abrir no editor
            </p>
          </div>
        </button>

        {isPro && (
          <div className="absolute top-2 right-2 h-10 w-10 flex items-center justify-center bg-black/50 rounded-full pointer-events-none">
            <Crown className="size-5 fill-yellow-500 text-yellow-500" />
          </div>
        )}

        {canManage && (
          <div className="absolute top-2 left-2 z-10" onClick={handleMenuClick}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleRenameClick}
                >
                  <Pencil className="size-4 mr-2" />
                  Renomear
                </DropdownMenuItem>

                {showMove && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <FolderInput className="size-4 mr-2" />
                      Mover para pasta
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-52">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={(e) => handleMoveClick(e, null)}
                        >
                          {currentCategoryId == null && (
                            <Check className="size-4 mr-2" />
                          )}
                          <span className={currentCategoryId == null ? "" : "ml-6"}>
                            Sem categoria
                          </span>
                        </DropdownMenuItem>

                        {folders && folders.length > 0 && (
                          <DropdownMenuSeparator />
                        )}

                        {folders?.map((folder) => {
                          const active = currentCategoryId === folder.id;
                          return (
                            <DropdownMenuItem
                              key={folder.id}
                              className="cursor-pointer"
                              onClick={(e) => handleMoveClick(e, folder.id)}
                            >
                              {active && <Check className="size-4 mr-2" />}
                              <span className={active ? "truncate" : "ml-6 truncate"}>
                                {folder.name}
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
                  onClick={handleDeleteClick}
                >
                  <Trash className="size-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium truncate">
          {title}
        </p>
        <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-75 transition">
          {description}
        </p>
      </div>
    </div>
  );
};