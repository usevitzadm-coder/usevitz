import { useState, useEffect } from "react";
import { Save, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originCep, setOriginCep] = useState("");
  const [originAddress, setOriginAddress] = useState("");

  useEffect(() => {
    fetchSettings();
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações da sua loja</p>
        </div>

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
    </AdminLayout>
  );
};

export default AdminSettings;
