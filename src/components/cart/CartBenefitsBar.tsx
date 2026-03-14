import { CreditCard, Truck, Check } from "lucide-react";

const INSTALLMENT_THRESHOLD = 180;
const FREE_SHIPPING_THRESHOLD = 239.90;

interface CartBenefitsBarProps {
  cartTotal: number;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const CartBenefitsBar = ({ cartTotal }: CartBenefitsBarProps) => {
  const installmentUnlocked = cartTotal >= INSTALLMENT_THRESHOLD;
  const freeShippingUnlocked = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const allUnlocked = installmentUnlocked && freeShippingUnlocked;

  const progress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const nextThreshold = !installmentUnlocked
    ? INSTALLMENT_THRESHOLD
    : !freeShippingUnlocked
      ? FREE_SHIPPING_THRESHOLD
      : FREE_SHIPPING_THRESHOLD;

  const remaining = Math.max(nextThreshold - cartTotal, 0);

  return (
    <div className="px-4 py-3 border-b border-border space-y-3">
      {/* Progress message */}
      <p className="text-xs text-center font-medium">
        {allUnlocked ? (
          <span className="text-primary">🎉 Você desbloqueou todos os benefícios!</span>
        ) : !installmentUnlocked ? (
          <>Faltam <strong>{formatPrice(remaining)}</strong> para parcelar em 3x sem juros</>
        ) : (
          <>Faltam <strong>{formatPrice(remaining)}</strong> para frete grátis no Sudeste</>
        )}
      </p>

      {/* Progress bar */}
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Installment marker */}
        <div
          className="absolute top-0 h-full w-px bg-border"
          style={{ left: `${(INSTALLMENT_THRESHOLD / FREE_SHIPPING_THRESHOLD) * 100}%` }}
        />
      </div>

      {/* Benefits list */}
      <div className="flex justify-between gap-2">
        <div className={`flex items-center gap-1.5 text-xs ${installmentUnlocked ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {installmentUnlocked ? <Check size={14} /> : <CreditCard size={14} />}
          <span>3x sem juros</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${freeShippingUnlocked ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {freeShippingUnlocked ? <Check size={14} /> : <Truck size={14} />}
          <span>Frete grátis SE</span>
        </div>
      </div>
    </div>
  );
};

export default CartBenefitsBar;
