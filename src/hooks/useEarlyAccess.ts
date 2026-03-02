import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EA_STORAGE_KEY = "vitz_ea_code";

export const useEarlyAccess = () => {
  const [searchParams] = useSearchParams();
  const eaFromUrl = searchParams.get("ea");

  const [code, setCode] = useState<string | null>(() => {
    return eaFromUrl || sessionStorage.getItem(EA_STORAGE_KEY);
  });

  // Persist code in sessionStorage when found in URL
  useEffect(() => {
    if (eaFromUrl) {
      sessionStorage.setItem(EA_STORAGE_KEY, eaFromUrl);
      setCode(eaFromUrl);
    }
  }, [eaFromUrl]);

  // On mount, always re-read from sessionStorage (for page navigations)
  useEffect(() => {
    const stored = sessionStorage.getItem(EA_STORAGE_KEY);
    if (stored && !code) {
      setCode(stored);
    }
  }, []);

  const { data: isEarlyAccess } = useQuery({
    queryKey: ["early-access-code", code],
    queryFn: async () => {
      if (!code) return false;
      const { data, error } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "early_access_code")
        .maybeSingle();
      if (error) return false;
      return data?.value === code;
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 10,
  });

  return isEarlyAccess || false;
};
