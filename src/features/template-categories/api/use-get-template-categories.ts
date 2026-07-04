import { useQuery } from "@tanstack/react-query";

import { listTemplateCategories } from "@/app/(brand)/_actions/template-categories";

export type TemplateCategory = {
  id: string;
  brandId: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export const useGetTemplateCategories = () => {
  const query = useQuery({
    queryKey: ["template-categories"],
    queryFn: async () => {
      const result = await listTemplateCategories();

      if (!("success" in result) || !result.success) {
        throw new Error("error" in result ? result.error : "Erro ao buscar pastas");
      }

      return result.categories as TemplateCategory[];
    },
  });

  return query;
};