import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { moveTemplateToCategory } from "@/app/(brand)/_actions/template-categories";

export const useMoveTemplate = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: {
      templateId: string;
      categoryId: string | null;
    }) => {
      const result = await moveTemplateToCategory(input);

      if (!("success" in result) || !result.success) {
        throw new Error("error" in result ? result.error : "Erro ao mover template");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Template movido");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao mover template");
    },
  });

  return mutation;
};