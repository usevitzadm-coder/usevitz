import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Minus, Plus, X, ArrowRight, Truck, Loader2, Package } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShippingOption {
  id: number;
  name: string;
  price: number;
  delivery_time: number;
  company: {
    name: string;
    picture: string;
  };
}

const SOUTHEAST_STATES = ["SP", "RJ", "MG", "ES"];
const FREE_SHIPPING_MIN = 239.90;

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const { toast } = useToast();

  // Shipping states
  const [shippingCep, setShippingCep] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [destinationState, setDestinationState] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.replace(/(\d{5})(\d{0,3})/, "$1-$2");
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

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setShippingCep(formatted);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      calculateShipping(digits);
    } else {
      setShippingOptions([]);
      setSelectedShipping(null);
      setDestinationState("");
    }
  };

  const calculateShipping = async (cep: string) => {
    if (!cep || cep.length < 8 || items.length === 0) return;

    setIsCalculatingShipping(true);
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      // Fetch address to get state
      const addressResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const addressData = await addressResponse.json();
      
      if (addressData.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive",
        });
        setIsCalculatingShipping(false);
        return;
      }

      const state = addressData.uf;
      setDestinationState(state);

      // Check for free shipping eligibility
      const subtotal = getCartTotal();
      const isSoutheast = SOUTHEAST_STATES.includes(state);
      const qualifiesForFreeShipping = isSoutheast && subtotal >= FREE_SHIPPING_MIN;

      // Fetch origin CEP from store settings
      const { data: settingsData } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "origin_cep")
        .maybeSingle();

      const originCep = settingsData?.value || "05524000";

      const products = items.map((item) => ({
        id: item.product.id,
        width: 15,
        height: 5,
        length: 20,
        weight: 0.3,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.functions.invoke("calculate-shipping", {
        body: {
          from: { postal_code: originCep },
          to: { postal_code: cep },
          products,
        },
      });

      if (error) throw error;

      let options: ShippingOption[] = [];

      if (data?.options && data.options.length > 0) {
        options = data.options;
      }

      // Add free shipping option if eligible
      if (qualifiesForFreeShipping) {
        const freeShippingOption: ShippingOption = {
          id: 0,
          name: "Frete Grátis Sudeste",
          price: 0,
          delivery_time: options.length > 0 ? Math.max(...options.map(o => o.delivery_time)) : 7,
          company: {
            name: "Vitz",
            picture: "",
          },
        };
        options = [freeShippingOption, ...options];
      }

      if (options.length > 0) {
        setShippingOptions(options);
        // Auto-select cheapest (which will be free shipping if eligible)
        const cheapest = options.reduce((prev, curr) =>
          prev.price < curr.price ? prev : curr
        );
        setSelectedShipping(cheapest);
      } else {
        toast({
          title: "Nenhuma opção de frete disponível",
          description: "Verifique o CEP informado",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error calculating shipping:", error);
      toast({
        title: "Erro ao calcular frete",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const subtotal = getCartTotal();
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal + shippingCost;

  // Check if user qualifies for free shipping promotion
  const isSoutheast = SOUTHEAST_STATES.includes(destinationState);
  const amountToFreeShipping = FREE_SHIPPING_MIN - subtotal;

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

                  {/* Shipping Calculator */}
                  <div className="mb-6">
                    <Label className="flex items-center gap-2 mb-2">
                      <Truck size={16} />
                      Calcular Frete
                    </Label>
                    <Input
                      type="text"
                      placeholder="00000-000"
                      value={shippingCep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="font-mono"
                    />
                    
                    {/* Free shipping promotion message */}
                    {amountToFreeShipping > 0 && (
                      <p className="text-xs text-primary mt-2">
                        🚚 Falta {formatPrice(amountToFreeShipping)} para frete grátis no Sudeste!
                      </p>
                    )}

                    {isCalculatingShipping && (
                      <div className="flex items-center justify-center py-3 mt-3">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Calculando...</span>
                      </div>
                    )}

                    {shippingOptions.length > 0 && !isCalculatingShipping && (
                      <div className="mt-3 space-y-2">
                        {shippingOptions.map((option) => (
                          <div
                            key={option.id}
                            onClick={() => setSelectedShipping(option)}
                            className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors text-sm ${
                              selectedShipping?.id === option.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {option.company.picture ? (
                                <img
                                  src={option.company.picture}
                                  alt={option.company.name}
                                  className="w-6 h-6 object-contain"
                                />
                              ) : (
                                <Package size={16} className="text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium text-xs">{option.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {option.delivery_time} {option.delivery_time === 1 ? "dia" : "dias"}
                                </p>
                              </div>
                            </div>
                            <span className={`font-semibold text-xs ${option.price === 0 ? "text-primary" : ""}`}>
                              {option.price === 0 ? "Grátis" : formatPrice(option.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
                        {selectedShipping ? (
                          selectedShipping.price === 0 ? (
                            <span className="text-primary">Grátis</span>
                          ) : (
                            formatPrice(selectedShipping.price)
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">Informe o CEP</span>
                        )}
                      </span>
                    </div>
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
