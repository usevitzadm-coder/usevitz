import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Mail, Lock, Eye, EyeOff, Phone, Package, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PasswordStrengthMeter, { getPasswordStrength } from "@/components/account/PasswordStrengthMeter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderSummary {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_method: string | null;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-yellow-500 text-white" },
  confirmed: { label: "Confirmado", className: "bg-blue-500 text-white" },
  processing: { label: "Preparando", className: "bg-purple-500 text-white" },
  shipped: { label: "Enviado", className: "bg-indigo-500 text-white" },
  delivered: { label: "Entregue", className: "bg-green-500 text-white" },
  cancelled: { label: "Cancelado", className: "bg-red-500 text-white" },
};

const paymentLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Aguardando", className: "bg-yellow-500/20 text-yellow-700" },
  approved: { label: "Aprovado", className: "bg-green-500/20 text-green-700" },
  rejected: { label: "Rejeitado", className: "bg-red-500/20 text-red-700" },
  refunded: { label: "Reembolsado", className: "bg-gray-500/20 text-gray-700" },
};

const AccountPage = () => {
  const { user, isLoading, signIn, signUp, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Load profile and orders when user is available
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
          setProfileLoading(false);
        });

      // Load user orders
      setOrdersLoading(true);
      supabase
        .from("orders")
        .select("id, order_number, total, status, payment_status, created_at, shipping_method")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setOrders(data);
          setOrdersLoading(false);
        });
    }
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setSubmitting(false);

    if (error) {
      toast({
        title: "Erro ao entrar",
        description: "E-mail ou senha incorretos.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Bem-vinda de volta!" });
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) {
        navigate(redirect);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirm) {
      toast({
        title: "Senhas não conferem",
        variant: "destructive",
      });
      return;
    }

    if (getPasswordStrength(signupPassword) < 4) {
      toast({
        title: "Senha muito fraca",
        description: "Atenda pelo menos 4 dos 5 requisitos de segurança.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName, signupPhone);
    setSubmitting(false);

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conta criada!",
        description: "Verifique seu e-mail para confirmar o cadastro.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Você saiu da sua conta" });
  };

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Minha Conta | Vitz</title>
        </Helmet>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </Layout>
      </>
    );
  }

  // Logged-in view
  if (user) {
    return (
      <>
        <Helmet>
          <title>Minha Conta | Vitz</title>
        </Helmet>
        <Layout>
          <div className="min-h-screen bg-background py-12 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="vitz-heading-md">Minha Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nome</Label>
                      <p className="text-foreground mt-1">
                        {profile?.full_name || user.user_metadata?.full_name || "—"}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">E-mail</Label>
                      <p className="text-foreground mt-1">{user.email}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da conta
                  </Button>
                </CardContent>
              </Card>

              {/* Orders Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5" />
                    Meus Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const status = statusLabels[order.status] || { label: order.status, className: "bg-gray-500 text-white" };
                        const payment = paymentLabels[order.payment_status] || { label: order.payment_status, className: "bg-gray-500/20 text-gray-700" };

                        return (
                          <div key={order.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{order.order_number}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              <p className="font-semibold">{formatPrice(order.total)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={status.className}>{status.label}</Badge>
                              <Badge variant="outline" className={payment.className}>{payment.label}</Badge>
                              {order.shipping_method && (
                                <span className="text-xs text-muted-foreground">{order.shipping_method}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  // Auth forms
  return (
    <>
      <Helmet>
        <title>Entrar | Vitz</title>
        <meta name="description" content="Entre ou crie sua conta Vitz" />
      </Helmet>
      <Layout>
        <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-md">
            <div className="text-center mb-8">
              <h1 className="vitz-heading-md mb-2">Minha Conta</h1>
              <p className="text-muted-foreground">
                Entre ou crie sua conta para comprar
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="login">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Criar conta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">E-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            className="pl-10 pr-10"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nome completo</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Seu nome"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            className="pl-10"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">E-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Crie uma senha forte"
                            className="pl-10 pr-10"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <PasswordStrengthMeter password={signupPassword} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirmar senha</Label>
                        <Input
                          id="signup-confirm"
                          type="password"
                          placeholder="Repita a senha"
                          value={signupConfirm}
                          onChange={(e) => setSignupConfirm(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? "Criando conta..." : "Criar conta"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AccountPage;
