import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

interface DeleteProjectArgs {
  id: string;
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function (args: DeleteProjectArgs) {
      const response = await client.api.projects[":id"].$delete({
        param: { id: args.id },
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: function (result) {
      toast.success("Removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      // @ts-ignore
      const deletedId = result?.data?.id;
      if (deletedId) {
        queryClient.invalidateQueries({ queryKey: ["project", { id: deletedId }] });
      }
    },
    onError: function () {
      toast.error("Erro ao deletar");
    },
  });

  return mutation;
};