import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BLACK_WEEK, campaignPhase } from '../../supabase/functions/_shared/blackweek';
const STORAGE_KEY = 'vitz-blackweek-early';
const Context = createContext({ active: false, theme: false, phase: 'off', now: Date.now(), token: '', preview: false });
function storedAccess() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as { token: string; expiresAt: number } | null; } catch { return null; }
}
export function BlackWeekProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [now, setNow] = useState(Date.now());
  const [access, setAccess] = useState(storedAccess);
  const [previewMode, setPreviewMode] = useState('');
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preview = params.get('preview');
    if (preview === 'blackweek' || preview === 'grupo') setPreviewMode(preview);
    if (params.get('acesso') === 'grupo' && now >= BLACK_WEEK.earlyStart && now < BLACK_WEEK.publicStart && !access) {
      supabase.functions.invoke('blackweek-access', { body: { access: 'grupo' } }).then(({ data, error }) => {
        if (!error && typeof data?.token === 'string') {
          setAccess(data);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
        }
      });
    }
  }, [location.search, now >= BLACK_WEEK.earlyStart, now >= BLACK_WEEK.publicStart, access]);
  const early = Boolean(access?.token && access.expiresAt === BLACK_WEEK.publicStart && now < access.expiresAt);
  const actualPhase = campaignPhase(now, early);
  const preview = Boolean(previewMode);
  const phase = preview ? (previewMode === 'grupo' ? 'early' : 'public') : actualPhase;
  const theme = phase === 'early' || phase === 'public';
  const active = actualPhase === 'early' || actualPhase === 'public';
  // Preview can display sample totals, but cannot authorize a payment discount.
  const publicPage = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/gymrats');
  useEffect(() => {
    document.documentElement.classList.toggle('blackweek', theme && publicPage);
    return () => document.documentElement.classList.remove('blackweek');
  }, [theme, publicPage]);
  return <Context.Provider value={{ active, theme, phase, now, token: early ? access?.token || '' : '', preview }}>{children}</Context.Provider>;
}
export const useBlackWeek = () => useContext(Context);
