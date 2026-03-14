import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import CartBenefitsBar from "./CartBenefitsBar";
import CartSuggestions from "./CartSuggestions";

const CartDrawer = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    getCartTotal,
  } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading text-xl">Seu Carrinho</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Benefits bar */}
        {items.length > 0 && <CartBenefitsBar cartTotal={getCartTotal()} />}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShoppingBag size={48} className="text-muted-foreground mb-4" />
              <h3 className="font-heading text-lg mb-2">Carrinho vazio</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Adicione produtos para continuar
              </p>
              <Button
                variant="hero"
                onClick={() => setIsCartOpen(false)}
                asChild
              >
                <Link to="/colecao/feminino">Explorar Produtos</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={`${item.product.id}-${item.variant.id}`}
                  className="p-4 flex gap-4"
                >
                  <img
                    src={item.colorImage || item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded"
                  />
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-sm">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.variant.size} / {item.variant.color}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          removeFromCart(item.product.id, item.variant.id)
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 border border-border rounded">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.variant.id,
                              item.quantity - 1
                            )
                          }
                          className="p-2 hover:bg-muted transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.variant.id,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.variant.stock}
                          className="p-2 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-medium text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 && <CartSuggestions />}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-heading text-xl">
                {formatPrice(getCartTotal())}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Frete calculado no checkout
            </p>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={() => setIsCartOpen(false)}
              asChild
            >
              <Link to="/checkout">Finalizar Compra</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setIsCartOpen(false)}
            >
              Continuar Comprando
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
