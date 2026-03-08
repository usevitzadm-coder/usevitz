import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Truck, CreditCard, Gift, Loader2, Package, Tag, X, QrCode, FileText, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import pixLogo from "@/assets/payment/pix.png";
import boletoLogo from "@/assets/payment/boleto.png";
import visaLogo from "@/assets/payment/visa.svg";
import mastercardLogo from "@/assets/payment/mastercard.png";
import eloLogo from "@/assets/payment/elo.png";

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

interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

interface PaymentResult {
  orderId: string;
  status: string;
  paymentMethod: string;
  pixQrCode?: string;
  pixQrCodeUrl?: string;
  pixExpiresAt?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  boletoPdf?: string;
  approved?: boolean;
  internalOrderId?: string;
}

const SOUTHEAST_STATES = ["SP", "RJ", "MG", "ES"];
const FREE_SHIPPING_MIN = 239.90;

const CheckoutPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getCartTotal, clearCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/conta?redirect=/checkout", { replace: true });
    }
  }, [user, authLoading, navigate]);
  const totalPrice = getCartTotal();
  const [isLoading, setIsLoading] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);
  const [giftCardApplied, setGiftCardApplied] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Shipping states
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | "boleto">("credit_card");
  const [cardData, setCardData] = useState({
    number: "",
    holder_name: "",
    exp_month: "",
    exp_year: "",
    cvv: "",
    installments: "1",
  });
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Auto-fill user data from profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      
      setCustomer((prev) => ({
        ...prev,
        name: data?.full_name || user.user_metadata?.full_name || prev.name,
        email: data?.email || user.email || prev.email,
        phone: user.user_metadata?.phone || prev.phone,
      }));
    };
    fetchProfile();
  }, [user]);

  // Load coupon from URL params (passed from cart)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const couponFromCart = params.get('coupon');
    if (couponFromCart) {
      applyCouponByCode(couponFromCart);
    }
  }, [location.search]);

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

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
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

  const handleCardChange = (field: string, value: string) => {
    if (field === "number") {
      value = formatCardNumber(value);
    } else if (field === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    } else if (field === "exp_month") {
      value = value.replace(/\D/g, "").slice(0, 2);
    } else if (field === "exp_year") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const isValidCEP = (cep: string): boolean => {
    const clean = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(clean);
  };

  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (!isValidCEP(cleanCep)) {
      return;
    }
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!response.ok) return;
      const data = await response.json();
      if (!data.erro) {
        const uf = data.uf || "";
        setShipping((prev) => ({
          ...prev,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: uf,
        }));
        // Calculate shipping after getting address, passing state directly
        calculateShipping(cleanCep, uf);
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

      // Add pickup option for specific CEP
      const PICKUP_CEP = "05524000";
      if (cep.replace(/\D/g, "") === PICKUP_CEP) {
        const pickupOption: ShippingOption = {
          id: 999,
          name: "Retirada Combinada",
          price: 0,
          delivery_time: 0,
          company: { name: "Vitz", picture: "" },
        };
        options = [pickupOption, ...options];
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

  const applyCouponByCode = async (code: string) => {
    setIsApplyingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (!coupon) return;

      // Check if coupon is active
      if (!coupon.is_active) return;

      // Check start date
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) return;

      // Check expiration
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return;

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return;

      // Check minimum order value
      if (coupon.min_order_value && totalPrice < coupon.min_order_value) return;

      // Apply coupon
      setAppliedCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        discount_value: coupon.discount_value,
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          title: "Cupom inválido",
          description: "Este cupom não existe.",
          variant: "destructive",
        });
        return;
      }

      if (!coupon.is_active) {
        toast({
          title: "Cupom inativo",
          description: "Este cupom não está mais ativo.",
          variant: "destructive",
        });
        return;
      }

      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        toast({
          title: "Cupom ainda não válido",
          variant: "destructive",
        });
        return;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: "Cupom expirado",
          variant: "destructive",
        });
        return;
      }

      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast({
          title: "Cupom esgotado",
          variant: "destructive",
        });
        return;
      }

      if (coupon.min_order_value && totalPrice < coupon.min_order_value) {
        toast({
          title: "Valor mínimo não atingido",
          description: `Pedido mínimo de ${formatPrice(coupon.min_order_value)}.`,
          variant: "destructive",
        });
        return;
      }

      setAppliedCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        discount_value: coupon.discount_value,
      });
      setCouponCode("");
      toast({
        title: "Cupom aplicado!",
        description: `Desconto de ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)} aplicado.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao aplicar cupom",
        variant: "destructive",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return (totalPrice * appliedCoupon.discount_value) / 100;
    }
    return Math.min(appliedCoupon.discount_value, totalPrice);
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
    if (paymentMethod === "credit_card") {
      if (!cardData.number || cardData.number.replace(/\D/g, "").length < 13) {
        toast({ title: "Número do cartão inválido", variant: "destructive" });
        return false;
      }
      if (!cardData.holder_name) {
        toast({ title: "Nome do titular obrigatório", variant: "destructive" });
        return false;
      }
      if (!cardData.exp_month || !cardData.exp_year) {
        toast({ title: "Data de validade obrigatória", variant: "destructive" });
        return false;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        toast({ title: "CVV inválido", variant: "destructive" });
        return false;
      }
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
        variant_id: item.variant.id,
      }));

      const couponDiscount = calculateCouponDiscount();

      const requestBody: any = {
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
        paymentMethod,
        giftCardCode: giftCardApplied ? giftCardCode : undefined,
        giftCardDiscount: giftCardApplied ? giftCardDiscount : 0,
        couponCode: appliedCoupon?.code,
        couponDiscount,
      };

      if (paymentMethod === "credit_card") {
        const installmentCount = parseInt(cardData.installments);
        const installmentOptions = getInstallmentOptions();
        const selectedInstallment = installmentOptions.find(opt => opt.value === cardData.installments);
        
        requestBody.cardData = {
          number: cardData.number.replace(/\D/g, ""),
          holder_name: cardData.holder_name,
          exp_month: parseInt(cardData.exp_month),
          exp_year: parseInt(cardData.exp_year),
          cvv: cardData.cvv,
          installments: installmentCount,
          totalWithInterest: selectedInstallment?.totalWithInterest || finalTotal,
          hasInterest: selectedInstallment?.hasInterest || false,
        };
      }

      const { data, error } = await supabase.functions.invoke("create-pagarme-checkout", {
        body: requestBody,
      });

      if (error) throw error;

      setPaymentResult(data);

      if (paymentMethod === "credit_card" && data.approved) {
        clearCart();
        toast({ title: "Pagamento aprovado!" });
        navigate(`/checkout/sucesso?order=${data.internalOrderId}`);
      } else if (paymentMethod === "credit_card" && !data.approved) {
        toast({ 
          title: "Pagamento não aprovado", 
          description: "Verifique os dados do cartão e tente novamente.",
          variant: "destructive" 
        });
      } else if (paymentMethod === "pix" || paymentMethod === "boleto") {
        clearCart();
        toast({ title: "Pedido criado! Complete o pagamento." });
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado!" });
  };

  const shippingCost = selectedShipping?.price || 0;
  const couponDiscount = calculateCouponDiscount();
  const finalTotal = Math.max(0, totalPrice - giftCardDiscount - couponDiscount + shippingCost);

  // Calculate installments with interest
  // Only purchases above R$180 can have up to 3x interest-free
  const INTEREST_FREE_MIN_VALUE = 180;
  const INTEREST_FREE_MAX_INSTALLMENTS = 3;
  const INTEREST_RATE = 0.0299; // 2.99% per month

  const calculateInstallmentWithInterest = (total: number, installments: number) => {
    // Compound interest formula: PMT = PV * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const r = INTEREST_RATE;
    const n = installments;
    const coefficient = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return total * coefficient;
  };

  const getInstallmentOptions = () => {
    const options = [];
    const qualifiesForInterestFree = finalTotal >= INTEREST_FREE_MIN_VALUE;

    for (let i = 1; i <= 12; i++) {
      const isInterestFree = qualifiesForInterestFree && i <= INTEREST_FREE_MAX_INSTALLMENTS;
      
      let installmentValue: number;
      let totalWithInterest: number;

      if (i === 1 || isInterestFree) {
        installmentValue = finalTotal / i;
        totalWithInterest = finalTotal;
      } else {
        installmentValue = calculateInstallmentWithInterest(finalTotal, i);
        totalWithInterest = installmentValue * i;
      }

      if (installmentValue >= 5) { // Minimum installment value
        let label: string;
        if (i === 1) {
          label = `1x de ${formatPrice(finalTotal)} (à vista)`;
        } else if (isInterestFree) {
          label = `${i}x de ${formatPrice(installmentValue)} sem juros`;
        } else {
          label = `${i}x de ${formatPrice(installmentValue)} (total: ${formatPrice(totalWithInterest)})`;
        }

        options.push({
          value: i.toString(),
          label,
          installmentValue,
          totalWithInterest,
          hasInterest: !isInterestFree && i > 1,
        });
      }
    }
    return options;
  };

  // Show payment result for Pix/Boleto
  if (paymentResult && (paymentResult.paymentMethod === "pix" || paymentResult.paymentMethod === "boleto")) {
    return (
      <>
        <Helmet>
          <title>Pagamento | Vitz</title>
        </Helmet>
        <Layout>
          <div className="min-h-screen bg-background py-8 md:py-12">
            <div className="container mx-auto px-4 max-w-lg">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    {paymentResult.paymentMethod === "pix" ? "Pague com Pix" : "Pague com Boleto"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {paymentResult.paymentMethod === "pix" && paymentResult.pixQrCode && (
                    <>
                      <div className="flex justify-center">
                        {paymentResult.pixQrCodeUrl ? (
                          <img 
                            src={paymentResult.pixQrCodeUrl} 
                            alt="QR Code Pix" 
                            className="w-48 h-48"
                          />
                        ) : (
                          <div className="w-48 h-48 bg-muted flex items-center justify-center rounded">
                            <QrCode className="w-24 h-24 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Código Pix (Copia e Cola)</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={paymentResult.pixQrCode} 
                            readOnly 
                            className="font-mono text-xs"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(paymentResult.pixQrCode!)}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        O código expira em 1 hora
                      </p>
                    </>
                  )}

                  {paymentResult.paymentMethod === "boleto" && (
                    <>
                      <div className="flex justify-center">
                        <FileText className="w-24 h-24 text-muted-foreground" />
                      </div>
                      {paymentResult.boletoBarcode && (
                        <div className="space-y-2">
                          <Label>Código de Barras</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={paymentResult.boletoBarcode} 
                              readOnly 
                              className="font-mono text-xs"
                            />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => copyToClipboard(paymentResult.boletoBarcode!)}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {paymentResult.boletoUrl && (
                          <Button 
                            className="flex-1" 
                            onClick={() => window.open(paymentResult.boletoUrl, "_blank")}
                          >
                            Ver Boleto
                          </Button>
                        )}
                        {paymentResult.boletoPdf && (
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open(paymentResult.boletoPdf, "_blank")}
                          >
                            Baixar PDF
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        O boleto vence em 3 dias úteis
                      </p>
                    </>
                  )}

                  <Separator />

                  <div className="text-center space-y-2">
                    <p className="font-medium">Total: {formatPrice(finalTotal)}</p>
                    <p className="text-sm text-muted-foreground">
                      Após a confirmação do pagamento, você receberá um e-mail com os detalhes do pedido.
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Voltar para a loja
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      </>
    );
  }

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
                                     {option.delivery_time === 0 ? "A combinar" : `${option.delivery_time} ${option.delivery_time === 1 ? "dia útil" : "dias úteis"}`}
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

                {/* Coupon */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="w-5 h-5" />
                      Cupom de Desconto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-primary" />
                          <div>
                            <p className="font-mono font-medium text-sm">{appliedCoupon.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {appliedCoupon.discount_type === 'percentage' 
                                ? `${appliedCoupon.discount_value}% de desconto`
                                : `${formatPrice(appliedCoupon.discount_value)} de desconto`
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="CODIGO"
                          className="flex-1 uppercase font-mono"
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                        >
                          {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                      <p className="text-sm text-primary mt-2">
                        Desconto de {formatPrice(giftCardDiscount)} aplicado!
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="w-5 h-5" />
                      Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as "credit_card" | "pix" | "boleto")}
                      className="grid grid-cols-3 gap-3"
                    >
                      <div>
                        <RadioGroupItem value="credit_card" id="credit_card" className="sr-only peer" />
                        <Label
                          htmlFor="credit_card"
                          className="flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                        >
                          <div className="flex gap-1">
                            <img src={visaLogo} alt="Visa" className="h-4" />
                            <img src={mastercardLogo} alt="Mastercard" className="h-4" />
                            <img src={eloLogo} alt="Elo" className="h-4" />
                          </div>
                          <span className="text-sm font-medium">Cartão</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="pix" id="pix" className="sr-only peer" />
                        <Label
                          htmlFor="pix"
                          className="flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                        >
                          <img src={pixLogo} alt="Pix" className="h-6" />
                          <span className="text-sm font-medium">Pix</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="boleto" id="boleto" className="sr-only peer" />
                        <Label
                          htmlFor="boleto"
                          className="flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                        >
                          <img src={boletoLogo} alt="Boleto" className="h-6" />
                          <span className="text-sm font-medium">Boleto</span>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Credit Card Form */}
                    {paymentMethod === "credit_card" && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label htmlFor="card_number">Número do Cartão</Label>
                          <Input
                            id="card_number"
                            value={cardData.number}
                            onChange={(e) => handleCardChange("number", e.target.value)}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                          />
                        </div>
                        <div>
                          <Label htmlFor="holder_name">Nome no Cartão</Label>
                          <Input
                            id="holder_name"
                            value={cardData.holder_name}
                            onChange={(e) => handleCardChange("holder_name", e.target.value.toUpperCase())}
                            placeholder="NOME COMO NO CARTÃO"
                            className="uppercase"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="exp_month">Mês</Label>
                            <Input
                              id="exp_month"
                              value={cardData.exp_month}
                              onChange={(e) => handleCardChange("exp_month", e.target.value)}
                              placeholder="MM"
                              maxLength={2}
                            />
                          </div>
                          <div>
                            <Label htmlFor="exp_year">Ano</Label>
                            <Input
                              id="exp_year"
                              value={cardData.exp_year}
                              onChange={(e) => handleCardChange("exp_year", e.target.value)}
                              placeholder="AAAA"
                              maxLength={4}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              value={cardData.cvv}
                              onChange={(e) => handleCardChange("cvv", e.target.value)}
                              placeholder="123"
                              maxLength={4}
                              type="password"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="installments">Parcelas</Label>
                          <Select
                            value={cardData.installments}
                            onValueChange={(value) => setCardData((prev) => ({ ...prev, installments: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione as parcelas" />
                            </SelectTrigger>
                            <SelectContent>
                              {getInstallmentOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "pix" && (
                      <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                        <p>Após finalizar, você receberá um QR Code para pagamento.</p>
                        <p>O pagamento deve ser feito em até 1 hora.</p>
                      </div>
                    )}

                    {paymentMethod === "boleto" && (
                      <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                        <p>Após finalizar, você receberá o boleto para pagamento.</p>
                        <p>O boleto vence em 3 dias úteis.</p>
                      </div>
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
                      {appliedCoupon && couponDiscount > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Cupom ({appliedCoupon.code})</span>
                          <span>-{formatPrice(couponDiscount)}</span>
                        </div>
                      )}
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
                        paymentMethod === "credit_card" ? "Pagar com Cartão" :
                        paymentMethod === "pix" ? "Gerar Pix" :
                        "Gerar Boleto"
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Pagamento processado via Pagar.me
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
