import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      toast({
        title: "Cupom inválido",
        description: "Este cupom não existe ou expirou.",
        variant: "destructive",
      });
    }
  };

  const subtotal = getCartTotal();
  const shipping = subtotal >= 299 ? 0 : 19.90;
  const total = subtotal + shipping;

  return (
    <>
      <Helmet>
        <title>Carrinho | Vitz - Roupas Fitness Premium</title>
      </Helmet>
      <Layout>
        <div className="vitz-container py-12">
          <h1 className="vitz-heading-lg text-foreground mb-8">Seu Carrinho</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-6">
                Seu carrinho está vazio
              </p>
              <Button variant="hero" asChild>
                <Link to="/colecao/feminino">Explorar Produtos</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="border-b border-border pb-4 mb-4 hidden md:grid grid-cols-12 gap-4 text-sm text-muted-foreground">
                  <span className="col-span-6">Produto</span>
                  <span className="col-span-2 text-center">Quantidade</span>
                  <span className="col-span-2 text-right">Preço</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>

                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li
                      key={`${item.product.id}-${item.variant.id}`}
                      className="py-6 grid grid-cols-12 gap-4 items-center"
                    >
                      {/* Product Info */}
                      <div className="col-span-12 md:col-span-6 flex gap-4">
                        <Link to={`/produto/${item.product.slug}`}>
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-24 h-28 object-cover rounded"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link
                            to={`/produto/${item.product.slug}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.variant.size} / {item.variant.color}
                          </p>
                          <button
                            onClick={() =>
                              removeFromCart(item.product.id, item.variant.id)
                            }
                            className="text-sm text-muted-foreground hover:text-destructive mt-2 flex items-center gap-1"
                          >
                            <X size={14} />
                            Remover
                          </button>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 md:col-span-2 flex justify-center">
                        <div className="flex items-center border border-border rounded">
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
                          <span className="w-8 text-center text-sm">
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
                            className="p-2 hover:bg-muted transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-4 md:col-span-2 text-right text-sm text-muted-foreground">
                        {formatPrice(item.product.price)}
                      </div>

                      {/* Total */}
                      <div className="col-span-4 md:col-span-2 text-right font-medium">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-vitz-cream-dark p-6 rounded-sm sticky top-24">
                  <h2 className="font-heading text-xl mb-6">Resumo do Pedido</h2>

                  {/* Coupon */}
                  <div className="mb-6">
                    <label className="vitz-label block mb-2">
                      Cupom de Desconto
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Código"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" onClick={handleApplyCoupon}>
                        Aplicar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="text-primary">Grátis</span>
                        ) : (
                          formatPrice(shipping)
                        )}
                      </span>
                    </div>
                    {subtotal < 299 && (
                      <p className="text-xs text-muted-foreground">
                        Frete grátis em compras acima de R$ 299
                      </p>
                    )}
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="font-medium">Total</span>
                      <span className="font-heading text-xl">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full mt-6"
                    asChild
                  >
                    <Link to="/checkout">
                      Finalizar Compra
                      <ArrowRight size={18} />
                    </Link>
                  </Button>

                  <Link
                    to="/colecao/feminino"
                    className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
                  >
                    Continuar comprando
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default CartPage;
