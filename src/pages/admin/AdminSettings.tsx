import { useState, useEffect } from "react";
import { Save, MapPin, Loader2, Users, Plus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originCep, setOriginCep] = useState("");
  const [originAddress, setOriginAddress] = useState("");

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchAdminUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("key", "origin_cep")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setOriginCep(formatCEP(data.value));
        fetchAddress(data.value);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      // Get all admin roles with profile info
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        // Get profiles for these users
        const userIds = rolesData.map((r) => r.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        const profilesMap = new Map(
          (profilesData || []).map((p) => [p.id, p])
        );

        const admins: AdminUser[] = rolesData.map((role) => {
          const profile = profilesMap.get(role.user_id);
          return {
            id: role.id,
            user_id: role.user_id,
            role: role.role,
            created_at: role.created_at,
            email: profile?.email || null,
            full_name: profile?.full_name || null,
          };
        });

        setAdminUsers(admins);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({ title: "Informe o email do usuário", variant: "destructive" });
      return;
    }

    setIsAddingAdmin(true);

    try {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", newAdminEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast({
          title: "Usuário não encontrado",
          description: "Este email não está cadastrado. O usuário precisa criar uma conta primeiro.",
          variant: "destructive",
        });
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Usuário já é administrador",
          variant: "destructive",
        });
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.id,
          role: "admin",
        });

      if (insertError) throw insertError;

      toast({ title: "Administrador adicionado com sucesso!" });
      setNewAdminEmail("");
      setIsDialogOpen(false);
      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error adding admin:", error);
      toast({
        title: "Erro ao adicionar administrador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminUserId: string) => {
    // Prevent removing self
    if (adminUserId === user?.id) {
      toast({
        title: "Não é possível remover seu próprio acesso",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      toast({ title: "Administrador removido" });
      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error removing admin:", error);
      toast({
        title: "Erro ao remover administrador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.replace(/(\d{5})(\d{0,3})/, "$1-$2");
  };

  const fetchAddress = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setOriginAddress(`${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
      } else {
        setOriginAddress("");
      }
    } catch {
      setOriginAddress("");
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setOriginCep(formatted);
    
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      fetchAddress(digits);
    } else {
      setOriginAddress("");
    }
  };

  const handleSave = async () => {
    const cepDigits = originCep.replace(/\D/g, "");
    
    if (cepDigits.length !== 8) {
      toast({ title: "CEP inválido", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("store_settings")
        .upsert({
          key: "origin_cep",
          value: cepDigits,
          description: "CEP de origem para cálculo de frete",
        }, { onConflict: "key" });

      if (error) throw error;

      toast({ title: "Configurações salvas com sucesso!" });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua loja</p>
      </div>

      {/* Admin Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Administradores
          </CardTitle>
          <CardDescription>
            Gerencie quem tem acesso ao painel administrativo. Apenas usuários com conta podem ser adicionados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhum administrador encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminUsers.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">
                                  {admin.full_name || "Sem nome"}
                                  {admin.user_id === user?.id && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Você
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">{admin.email || "Sem email"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(admin.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            {admin.user_id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {admin.full_name || admin.email} perderá acesso ao painel administrativo.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveAdmin(admin.id, admin.user_id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Administrador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Administrador</DialogTitle>
                    <DialogDescription>
                      O usuário precisa ter uma conta criada. Informe o email usado no cadastro.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="adminEmail">Email do usuário</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddAdmin} disabled={isAddingAdmin}>
                      {isAddingAdmin ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        "Adicionar"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      {/* Origin Address Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço de Origem
          </CardTitle>
          <CardDescription>
            Configure o CEP de origem para cálculo de frete. Este é o endereço de onde os produtos são enviados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="originCep">CEP de Origem</Label>
            <Input
              id="originCep"
              value={originCep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              className="font-mono"
            />
          </div>

          {originAddress && (
            <p className="text-sm text-muted-foreground">
              📍 {originAddress}
            </p>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
