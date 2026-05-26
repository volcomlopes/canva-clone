import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SaveTemplateArgs {
  mode: "create" | "update";
  name?: string;
  targetTemplateId?: string;
}

export const useSaveAsTemplate = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function (args: SaveTemplateArgs) {
      // Usa fetch direto pra evitar filtragem do cliente Hono
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