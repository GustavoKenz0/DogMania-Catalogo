import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProducts(admin = false) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["products", admin ? "admin" : "public"],
    queryFn: () => api.fetchProducts(admin),
    staleTime: 10000,
    refetchInterval: 30000,
    retry: false,
  });
  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("dogmania-catalog") : null;
    if (channel)
      channel.onmessage = () => {
        void client.invalidateQueries({ queryKey: ["products"] });
      };
    return () => channel?.close();
  }, [client]);

  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["products"] });
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("dogmania-catalog");
      channel.postMessage("updated");
      channel.close();
    }
  };
  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    refresh,
  };
}
