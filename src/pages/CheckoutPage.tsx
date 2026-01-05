import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Truck, CreditCard, Gift, Loader2, Package } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
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

const CheckoutPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { items, getCartTotal, clearCart } = useCart();
  const totalPrice = getCartTotal();
  const [isLoading, setIsLoading] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);
  const [giftCardApplied, setGiftCardApplied] = useState(false);

  // Shipping states
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
  });

  const [shipping, setShipping] = useState({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.replace(/(\d{5})(\d{0,3})/, "$1-$2");
  };

  const handleCustomerChange = (field: string, value: string) => {
    if (field === "cpf") {
      value = formatCPF(value);
    } else if (field === "phone") {
      value = formatPhone(value);
    }
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingChange = (field: string, value: string) => {
    if (field === "zipCode") {
      value = formatCEP(value);
      // Auto-fetch address when CEP is complete
      if (value.replace(/\D/g, "").length === 8) {
        fetchAddress(value.replace(/\D/g, ""));
      }
    }
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const fetchAddress = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setShipping((prev) => ({
          ...prev,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        }));
        // Calculate shipping after getting address
        calculateShipping(cep);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const calculateShipping = async (cep: string) => {
    if (!cep || cep.length < 8 || items.length === 0) return;

    setIsCalculatingShipping(true);
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
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

      // Check for free shipping eligibility (Southeast + minimum order)
      const isSoutheast = SOUTHEAST_STATES.includes(shipping.state);
      const qualifiesForFreeShipping = isSoutheast && totalPrice >= FREE_SHIPPING_MIN;

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
        // Auto-select cheapest option (free shipping if available)
        const cheapest = options.reduce((prev: ShippingOption, curr: ShippingOption) =>
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

  const applyGiftCard = async () => {
    if (!giftCardCode.trim()) return;

    try {
      const normalizedCode = giftCardCode.replace(/[-\s]/g, "").toUpperCase();
      const formattedCode = normalizedCode.match(/.{1,4}/g)?.join("-") || normalizedCode;

      const { data, error } = await supabase
        .from("gift_cards")
        .select("current_balance, is_active, expires_at")
        .eq("code", formattedCode)
        .single();

      if (error || !data) {
        toast({ title: "Gift card não encontrado", variant: "destructive" });
        return;
      }

      if (!data.is_active) {
        toast({ title: "Gift card inativo", variant: "destructive" });
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast({ title: "Gift card expirado", variant: "destructive" });
        return;
      }

      const discount = Math.min(data.current_balance, totalPrice);
      setGiftCardDiscount(discount);
      setGiftCardApplied(true);
      toast({ title: `Desconto de ${formatPrice(discount)} aplicado!` });
    } catch (error) {
      toast({ title: "Erro ao aplicar gift card", variant: "destructive" });
    }
  };

  const validateForm = () => {
    if (!customer.name || !customer.email || !customer.cpf || !customer.phone) {
      toast({ title: "Preencha todos os dados pessoais", variant: "destructive" });
      return false;
    }
    if (!shipping.zipCode || !shipping.street || !shipping.number || !shipping.city || !shipping.state) {
      toast({ title: "Preencha o endereço completo", variant: "destructive" });
      return false;
    }
    if (customer.cpf.replace(/\D/g, "").length !== 11) {
      toast({ title: "CPF inválido", variant: "destructive" });
      return false;
    }
    if (!selectedShipping) {
      toast({ title: "Selecione uma opção de frete", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const checkoutItems = items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.variant.size,
        color: item.variant.color,
        image: item.product.images?.[0],
      }));

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: checkoutItems,
          customer: {
            name: customer.name,
            email: customer.email,
            cpf: customer.cpf.replace(/\D/g, ""),
            phone: customer.phone.replace(/\D/g, ""),
          },
          shipping: {
            zipCode: shipping.zipCode,
            street: shipping.street,
            number: shipping.number,
            complement: shipping.complement,
            neighborhood: shipping.neighborhood,
            city: shipping.city,
            state: shipping.state,
          },
          shippingOption: selectedShipping ? {
            id: selectedShipping.id,
            name: selectedShipping.name,
            price: selectedShipping.price,
            delivery_time: selectedShipping.delivery_time,
          } : undefined,
          giftCardCode: giftCardApplied ? giftCardCode : undefined,
          giftCardDiscount: giftCardApplied ? giftCardDiscount : 0,
        },
      });

      if (error) throw error;

      // Redirect to Mercado Pago checkout
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shippingCost = selectedShipping?.price || 0;
  const finalTotal = Math.max(0, totalPrice - giftCardDiscount + shippingCost);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-20">
          <div className="container mx-auto px-4 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Carrinho vazio</h1>
            <p className="text-muted-foreground mb-6">Adicione produtos para continuar</p>
            <Button onClick={() => navigate("/produtos")}>Ver produtos</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Vitz</title>
        <meta name="description" content="Finalize sua compra na Vitz" />
      </Helmet>
      <Layout>
        <div className="min-h-screen bg-background py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="w-5 h-5" />
                      Dados pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        value={customer.name}
                        onChange={(e) => handleCustomerChange("name", e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customer.email}
                        onChange={(e) => handleCustomerChange("email", e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={customer.phone}
                        onChange={(e) => handleCustomerChange("phone", e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={customer.cpf}
                        onChange={(e) => handleCustomerChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="w-5 h-5" />
                      Endereço de entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={shipping.zipCode}
                        onChange={(e) => handleShippingChange("zipCode", e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        value={shipping.street}
                        onChange={(e) => handleShippingChange("street", e.target.value)}
                        placeholder="Nome da rua"
                      />
                    </div>
                    <div>
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        value={shipping.number}
                        onChange={(e) => handleShippingChange("number", e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={shipping.complement}
                        onChange={(e) => handleShippingChange("complement", e.target.value)}
                        placeholder="Apto, bloco (opcional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={shipping.neighborhood}
                        onChange={(e) => handleShippingChange("neighborhood", e.target.value)}
                        placeholder="Bairro"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={shipping.city}
                        onChange={(e) => handleShippingChange("city", e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={shipping.state}
                        onChange={(e) => handleShippingChange("state", e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Options */}
                {shipping.zipCode.replace(/\D/g, "").length === 8 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="w-5 h-5" />
                        Opções de frete
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isCalculatingShipping ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          <span className="text-muted-foreground">Calculando frete...</span>
                        </div>
                      ) : shippingOptions.length > 0 ? (
                        <div className="space-y-3">
                          {shippingOptions.map((option) => (
                            <div
                              key={option.id}
                              onClick={() => setSelectedShipping(option)}
                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedShipping?.id === option.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {option.company.picture && (
                                  <img
                                    src={option.company.picture}
                                    alt={option.company.name}
                                    className="w-10 h-10 object-contain"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-sm">{option.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {option.delivery_time} {option.delivery_time === 1 ? "dia útil" : "dias úteis"}
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold">{formatPrice(option.price)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Informe o CEP para ver as opções de frete
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Gift Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Gift className="w-5 h-5" />
                      Gift Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        disabled={giftCardApplied}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={applyGiftCard}
                        disabled={giftCardApplied || !giftCardCode.trim()}
                      >
                        {giftCardApplied ? "Aplicado" : "Aplicar"}
                      </Button>
                    </div>
                    {giftCardApplied && (
                      <p className="text-sm text-green-600 mt-2">
                        Desconto de {formatPrice(giftCardDiscount)} aplicado!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShoppingBag className="w-5 h-5" />
                      Resumo do pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item) => (
                      <div key={`${item.product.id}-${item.variant.id}`} className="flex gap-3">
                        <img
                          src={item.product.images?.[0] || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.variant.size} {item.variant.color && `• ${item.variant.color}`} • Qtd: {item.quantity}
                          </p>
                          <p className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      {giftCardApplied && (
                        <div className="flex justify-between text-green-600">
                          <span>Gift Card</span>
                          <span>-{formatPrice(giftCardDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete</span>
                        {selectedShipping ? (
                          <span>{formatPrice(selectedShipping.price)}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Calcule o frete</span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(finalTotal)}</span>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Finalizar compra"
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Você será redirecionado para o Mercado Pago
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CheckoutPage;
