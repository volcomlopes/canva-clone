import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useDuplicateFromTemplate = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function (templateId: string) {
      const response = await client.api.projects[":id"][
        "duplicate-from-template"
      ].$post({
        param: { id: templateId },
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate template");
      }

      return await response.json();
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: function () {
      toast.error("Erro ao abrir template");
    },
  });

  return mutation;
};