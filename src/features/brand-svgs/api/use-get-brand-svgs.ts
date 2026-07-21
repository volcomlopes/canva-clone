import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useGetBrandSvgs = () => {
  const query = useQuery({
    queryKey: ["brand-svgs"],
    queryFn: async () => {
      const response = await client.api["brand-svgs"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch brand svgs");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};