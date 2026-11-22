import { useCart } from '@/context/CartContext';
import { useBlackWeek } from '@/context/BlackWeekContext';
import { eligibleCount, isSet } from '../../../supabase/functions/_shared/blackweek';
export default function BlackWeekSummary() {
  const { items, blackWeekDiscount } = useCart();
  const { active, preview } = useBlackWeek();
  if (!active && !preview) return null;
  const count = eligibleCount(items.map(item => ({ price: item.product.price, quantity: item.quantity, eligible: isSet(item.product.category, item.product.name) })));
  return <>{count === 1 && <p className="text-xs text-primary py-2">Adicione mais 1 conjunto e o de menor valor sai grátis</p>}{blackWeekDiscount > 0 && <div className="flex justify-between gap-3 text-sm text-primary py-2"><span>Black Week</span><span>−{blackWeekDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>}</>;
}
