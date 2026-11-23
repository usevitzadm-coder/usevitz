import { Link } from 'react-router-dom';
import { useBlackWeek } from '@/context/BlackWeekContext';
import { BLACK_WEEK } from '../../../supabase/functions/_shared/blackweek';
export default function BlackWeekBanner() {
  const { phase, now, preview } = useBlackWeek();
  if (phase === 'off') return null;
  const target = phase === 'teaser' ? BLACK_WEEK.publicStart : phase === 'early' ? BLACK_WEEK.publicStart : BLACK_WEEK.end;
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  const time = `${Math.floor(seconds / 86400)}d ${String(Math.floor(seconds / 3600) % 24).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const text = phase === 'teaser' ? 'Black Week Vitz começa 27/11' : phase === 'early' ? 'ACESSO ANTECIPADO · Só para o grupo · Compre 1 peça, leve 2' : now >= BLACK_WEEK.lastDay && !preview ? 'ÚLTIMAS HORAS · acaba hoje às 23h59' : 'BLACK WEEK VITZ · Compre 1 peça, leve 2 · Roupas participantes · até 30/11';
  return <Link to="/produtos" className="blackweek-banner flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 px-3 py-2 bg-primary text-primary-foreground text-center text-xs font-medium"><span>{text}</span><span className="font-mono tabular-nums">{time}</span></Link>;
}
