import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const normalizeCode = (value: string | null | undefined) =>
  value?.trim().toUpperCase() || null;

export const useEarlyAccess = () => {
  const [searchParams] = useSearchParams();
  const code = normalizeCode(searchParams.get("ea"));

  const { data: isEarlyAccess = false } = useQuery({
    queryKey: ["early-access-code", code],
    queryFn: async () => {
      if (!code) return false;

      const { data, error } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "early_access_code")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return false;

      return normalizeCode(data?.value) === code;
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 10,
    placeholderData: false,
  });

  return !!code && isEarlyAccess;
};
