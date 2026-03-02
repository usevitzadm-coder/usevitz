import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EA_STORAGE_KEY = "vitz_ea_code";

const normalizeCode = (value: string | null | undefined) =>
  value?.trim().toUpperCase() || null;

const getStoredCode = () => {
  try {
    return normalizeCode(localStorage.getItem(EA_STORAGE_KEY));
  } catch {
    return null;
  }
};

const saveCode = (value: string) => {
  const normalized = normalizeCode(value);
  if (!normalized) return null;

  try {
    localStorage.setItem(EA_STORAGE_KEY, normalized);
  } catch {
    // noop
  }

  return normalized;
};

export const useEarlyAccess = () => {
  const [searchParams] = useSearchParams();
  const eaFromUrl = searchParams.get("ea");

  const [code, setCode] = useState<string | null>(() => {
    return normalizeCode(eaFromUrl) || getStoredCode();
  });

  useEffect(() => {
    if (!eaFromUrl) return;

    const normalized = saveCode(eaFromUrl);
    if (normalized && normalized !== code) {
      setCode(normalized);
    }
  }, [eaFromUrl, code]);

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
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    placeholderData: (previous) => previous,
  });

  return isEarlyAccess;
};
