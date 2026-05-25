import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useSaveAsTemplate = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function () {
      const response = await client.api.projects[":id"][
        "save-as-template"
      ].$post({
        param: { id: projectId },
      });

      if (!response.ok) {
        throw new Error("Failed to save as template");
      }

      return await response.json();
    },
    onSuccess: function () {
      toast.success("Template salvo na galeria da sua marca!");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: function () {
      toast.error("Erro ao salvar template");
    },
  });

  return mutation;
};