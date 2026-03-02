import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EA_STORAGE_KEY = "vitz_ea_code";

export const useEarlyAccess = () => {
  const [searchParams] = useSearchParams();
  const eaFromUrl = searchParams.get("ea");

  // Persist code in sessionStorage when found in URL
  useEffect(() => {
    if (eaFromUrl) {
      sessionStorage.setItem(EA_STORAGE_KEY, eaFromUrl);
    }
  }, [eaFromUrl]);

  const storedCode = eaFromUrl || sessionStorage.getItem(EA_STORAGE_KEY);

  const { data: isEarlyAccess } = useQuery({
    queryKey: ["early-access-code", storedCode],
    queryFn: async () => {
      if (!storedCode) return false;
      const { data, error } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "early_access_code")
        .maybeSingle();
      if (error) return false;
      return data?.value === storedCode;
    },
    enabled: !!storedCode,
    staleTime: 1000 * 60 * 5,
  });

  return isEarlyAccess || false;
};
