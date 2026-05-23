import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useGetBrandKit = () => {
  const query = useQuery({
    queryKey: ["brand-kit"],
    queryFn: async () => {
      const response = await client.api["brand-kit"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch brand kit");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};