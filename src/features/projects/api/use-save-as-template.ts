import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { genUploader } from "uploadthing/client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>();

interface SaveTemplateArgs {
  mode: "create" | "update";
  name?: string;
  targetTemplateId?: string;
  thumbnailDataUrl?: string;
  categoryId?: string | null;
}

const dataUrlToFile = async function (dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

export const useSaveAsTemplate = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function (args: SaveTemplateArgs) {
      let thumbnailUrl: string | undefined;

      if (args.thumbnailDataUrl) {
        try {
          const file = await dataUrlToFile(
            args.thumbnailDataUrl,
            `template-${Date.now()}.png`
          );

          const uploadResult = await uploadFiles("templateThumbnailUploader", {
            files: [file],
          });

          if (uploadResult && uploadResult[0]) {
            thumbnailUrl = uploadResult[0].url;
          }
        } catch (error) {
          console.warn("Falha no upload do thumbnail:", error);
        }
      }

      const response = await fetch(
        `/api/projects/${projectId}/save-as-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: args.mode,
            name: args.name,
            targetTemplateId: args.targetTemplateId,
            thumbnailUrl: thumbnailUrl,
            categoryId: args.categoryId ?? null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save as template");
      }

      return await response.json();
    },
    onSuccess: async function (data) {
      const mode = data.mode || "create";
      if (mode === "update") {
        toast.success("Template atualizado!");
      } else {
        toast.success("Template salvo!");
      }

      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.refetchQueries({
        queryKey: ["project", { id: projectId }],
        exact: true,
      });
    },
    onError: function () {
      toast.error("Erro ao salvar template");
    },
  });

  return mutation;
};