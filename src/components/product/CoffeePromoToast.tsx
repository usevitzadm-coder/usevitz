import { useEffect, useState } from "react";
import { X, Coffee } from "lucide-react";
import logoFeraCafe from "@/assets/logo-fera-cafe.png";

interface CoffeePromoToastProps {
  visible: boolean;
  onClose: () => void;
}

export default function CoffeePromoToast({ visible, onClose }: CoffeePromoToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setShow(true));
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 transition-all duration-500 ease-out ${
        show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
      }`}
    >
      <div
        className="relative rounded-2xl p-4 pr-10 shadow-2xl border flex items-start gap-3"
        style={{
          backgroundColor: "#3b1f04",
          borderColor: "rgba(191, 162, 117, 0.3)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full transition-colors"
          style={{ color: "#bfa275" }}
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(191, 162, 117, 0.15)" }}
        >
          <Coffee className="w-6 h-6" style={{ color: "#bfa275" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-tight mb-1"
            style={{ color: "#f5ead6" }}
          >
            ☕ Drip coffee garantido!
          </p>
          <p
            className="text-xs leading-relaxed mb-2"
            style={{ color: "#d4c4a8" }}
          >
            Você adicionou uma peça Coffee! Seu drip coffee exclusivo será enviado junto com seu pedido.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "#a0693a" }}>
              Em parceria com
            </span>
            <img src={logoFeraCafe} alt="Fera Café" className="h-5 w-auto object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
