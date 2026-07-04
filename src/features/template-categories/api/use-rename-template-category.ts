import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { renameTemplateCategory } from "@/app/(brand)/_actions/template-categories";

export const useRenameTemplateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const result = await renameTemplateCategory(input);

      if (!("success" in result) || !result.success) {
        throw new Error("error" in result ? result.error : "Erro ao renomear pasta");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Pasta renomeada");
      queryClient.invalidateQueries({ queryKey: ["template-categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao renomear pasta");
    },
  });

  return mutation;
};