import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

interface RenameTemplateArgs {
  id: string;
  name: string;
}

export const useRenameTemplate = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function (args: RenameTemplateArgs) {
      const response = await client.api.projects[":id"].$patch({
        param: { id: args.id },
        json: { name: args.name },
      });

      if (!response.ok) {
        throw new Error("Failed to rename");
      }

      return await response.json();
    },
    onSuccess: function () {
      toast.success("Renomeado!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: function () {
      toast.error("Erro ao renomear");
    },
  });

  return mutation;
};