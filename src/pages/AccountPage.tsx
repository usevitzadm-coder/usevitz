import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Mail, Lock, Eye, EyeOff, Phone, Package, Loader2, XCircle, MessageCircle, ArrowLeft, KeyRound } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
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

  // Forgot password state
  type ForgotStep = "idle" | "email" | "otp" | "newPassword";
  const [forgotStep, setForgotStep] = useState<ForgotStep>("idle");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Cancellation state
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [existingCancellations, setExistingCancellations] = useState<string[]>([]);

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

      // Load existing cancellation requests
      supabase
        .from("cancellation_requests")
        .select("order_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) setExistingCancellations(data.map((r: { order_id: string }) => r.order_id));
        });
    }
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleCancelRequest = async () => {
    if (!cancelOrderId || !cancelReason.trim() || !user) return;
    setCancelSubmitting(true);
    try {
      const { error } = await supabase
        .from("cancellation_requests")
        .insert({
          order_id: cancelOrderId,
          user_id: user.id,
          reason: cancelReason.trim(),
        });

      if (error) throw error;

      setExistingCancellations((prev) => [...prev, cancelOrderId]);
      setCancelOrderId(null);
      setCancelReason("");
      toast({ title: "Solicitação enviada!", description: "Retornaremos em até 3 dias úteis." });
    } catch {
      toast({ title: "Erro ao enviar solicitação", variant: "destructive" });
    } finally {
      setCancelSubmitting(false);
    }
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

  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: forgotEmail,
      options: { shouldCreateUser: false },
    });
    setForgotSubmitting(false);
    if (error) {
      toast({ title: "Erro ao enviar código", description: "Verifique o e-mail informado.", variant: "destructive" });
    } else {
      toast({ title: "Código enviado!", description: "Verifique seu e-mail." });
      setForgotStep("otp");
    }
  };

  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: forgotEmail,
      token: forgotOtp,
      type: "email",
    });
    setForgotSubmitting(false);
    if (error) {
      toast({ title: "Código inválido ou expirado", description: "Tente novamente.", variant: "destructive" });
    } else {
      setForgotStep("newPassword");
    }
  };

  const handleForgotSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getPasswordStrength(forgotNewPassword) < 3) {
      toast({ title: "Senha muito fraca", description: "Use pelo menos 8 caracteres com letras e números.", variant: "destructive" });
      return;
    }
    setForgotSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: forgotNewPassword });
    setForgotSubmitting(false);
    if (error) {
      toast({ title: "Erro ao redefinir senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha redefinida com sucesso!", description: "Você já está logada." });
      setForgotStep("idle");
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={status.className}>{status.label}</Badge>
                                <Badge variant="outline" className={payment.className}>{payment.label}</Badge>
                                {order.shipping_method && (
                                  <span className="text-xs text-muted-foreground">{order.shipping_method}</span>
                                )}
                              </div>
                              {order.status !== "cancelled" && order.status !== "delivered" && !existingCancellations.includes(order.id) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-destructive hover:text-destructive"
                                  onClick={() => setCancelOrderId(order.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Cancelar
                                </Button>
                              )}
                              {existingCancellations.includes(order.id) && (
                                <span className="text-xs text-muted-foreground italic">Cancelamento solicitado</span>
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

          {/* Cancellation Dialog */}
          <Dialog open={!!cancelOrderId} onOpenChange={() => { setCancelOrderId(null); setCancelReason(""); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar Cancelamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Motivo do cancelamento</Label>
                  <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Descreva o motivo do cancelamento..."
                    rows={4}
                    className="mt-1"
                    maxLength={500}
                  />
                </div>

                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    ⏱ Prazo de resposta: <strong>até 3 dias úteis</strong>
                  </p>
                  <p className="text-muted-foreground">
                    Para agilizar, fale conosco pelo WhatsApp:
                  </p>
                  <a
                    href="https://wa.me/5511915204545"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chamar no WhatsApp
                  </a>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setCancelOrderId(null); setCancelReason(""); }}>
                    Voltar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelRequest}
                    disabled={cancelSubmitting || !cancelReason.trim()}
                  >
                    {cancelSubmitting ? "Enviando..." : "Enviar solicitação"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
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

            {/* Forgot Password Flow */}
            {forgotStep !== "idle" ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => { setForgotStep("idle"); setForgotEmail(""); setForgotOtp(""); setForgotNewPassword(""); }}
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar para o login
                  </button>

                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-base">
                      {forgotStep === "email" && "Redefinir senha"}
                      {forgotStep === "otp" && "Confirmar código"}
                      {forgotStep === "newPassword" && "Nova senha"}
                    </h2>
                  </div>

                  {forgotStep === "email" && (
                    <form onSubmit={handleForgotSendOtp} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Informe seu e-mail e enviaremos um código de verificação.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">E-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={forgotSubmitting}>
                        {forgotSubmitting ? "Enviando..." : "Enviar código"}
                      </Button>
                    </form>
                  )}

                  {forgotStep === "otp" && (
                    <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Digite o código de 6 dígitos enviado para <strong>{forgotEmail}</strong>.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-otp">Código de verificação</Label>
                        <Input
                          id="forgot-otp"
                          type="text"
                          inputMode="numeric"
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-2xl tracking-widest font-mono"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={forgotSubmitting || forgotOtp.length < 6}>
                        {forgotSubmitting ? "Verificando..." : "Confirmar código"}
                      </Button>
                      <button
                        type="button"
                        className="w-full text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                        onClick={handleForgotSendOtp}
                        disabled={forgotSubmitting}
                      >
                        Reenviar código
                      </button>
                    </form>
                  )}

                  {forgotStep === "newPassword" && (
                    <form onSubmit={handleForgotSetPassword} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Crie uma nova senha para sua conta.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-new-password">Nova senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="forgot-new-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Crie uma senha forte"
                            className="pl-10 pr-10"
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
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
                        <PasswordStrengthMeter password={forgotNewPassword} />
                      </div>
                      <Button type="submit" className="w-full" disabled={forgotSubmitting}>
                        {forgotSubmitting ? "Salvando..." : "Redefinir senha"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ) : (
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

                      <div className="text-right">
                        <button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                          onClick={() => { setForgotEmail(loginEmail); setForgotStep("email"); }}
                        >
                          Esqueci a senha
                        </button>
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
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AccountPage;

