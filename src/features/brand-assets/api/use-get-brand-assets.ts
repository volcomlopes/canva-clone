import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useGetBrandAssets = () => {
  const query = useQuery({
    queryKey: ["brand-assets"],
    queryFn: async () => {
      const response = await client.api["brand-assets"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch brand assets");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};