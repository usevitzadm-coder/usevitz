import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AccountPage = () => {
  const { user, isLoading, signIn, signUp, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load profile when user is available
  useState(() => {
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
    }
  });

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
      // Check if there's a redirect
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

    if (signupPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Use pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
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
            <div className="container mx-auto px-4 max-w-lg">
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
                            placeholder="Mínimo 6 caracteres"
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
