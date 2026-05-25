import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useGetBrandSettings = () => {
  const query = useQuery({
    queryKey: ["brand-settings"],
    queryFn: async function () {
      const response = await client.api["brand-settings"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch brand settings");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};