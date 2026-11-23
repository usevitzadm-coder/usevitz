import { useCart } from '@/context/CartContext';
import { useBlackWeek } from '@/context/BlackWeekContext';
import { eligibleCount, campaignItem } from '../../../supabase/functions/_shared/blackweek';
export default function BlackWeekSummary() {
  const { items, blackWeekDiscount } = useCart();
  const { active, preview } = useBlackWeek();
  if (!active && !preview) return null;
  const count = eligibleCount(items.map(item => campaignItem(item.product.price, item.quantity, item.product.category, item.product.name)));
  return <>{count % 2 === 1 && <p className="text-xs text-primary py-2">Adicione mais 1 peça de roupa para formar outro par; a de menor valor do par sai grátis</p>}{blackWeekDiscount > 0 && <div className="flex justify-between gap-3 text-sm text-primary py-2"><span>Black Week</span><span>−{blackWeekDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>}</>;
}
