import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteTemplateCategory } from "@/app/(brand)/_actions/template-categories";

export const useDeleteTemplateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTemplateCategory({ id });

      if (!("success" in result) || !result.success) {
        throw new Error("error" in result ? result.error : "Erro ao excluir pasta");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Pasta excluida");
      queryClient.invalidateQueries({ queryKey: ["template-categories"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir pasta");
    },
  });

  return mutation;
};