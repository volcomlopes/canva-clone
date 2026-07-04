import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createTemplateCategory } from "@/app/(brand)/_actions/template-categories";

export const useCreateTemplateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await createTemplateCategory({ name });

      if (!("success" in result) || !result.success) {
        throw new Error("error" in result ? result.error : "Erro ao criar pasta");
      }

      return result.category;
    },
    onSuccess: () => {
      toast.success("Pasta criada");
      queryClient.invalidateQueries({ queryKey: ["template-categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar pasta");
    },
  });

  return mutation;
};