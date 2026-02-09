import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

interface LaunchLeadFormProps {
  productId: string;
}

const LaunchLeadForm = ({ productId }: LaunchLeadFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("launch_leads")
        .insert({ product_id: productId, email });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Você já está inscrito!",
            description: "Esse e-mail já está na lista de espera para este produto.",
          });
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: "Inscrição confirmada! 🎉",
          description: "Você será notificado quando este produto estiver disponível.",
        });
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a inscrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-muted/50 border border-border rounded-sm p-6 text-center space-y-2">
        <Mail className="mx-auto h-8 w-8 text-primary" />
        <p className="font-medium text-foreground">Você está na lista! 🎉</p>
        <p className="text-sm text-muted-foreground">
          Avisaremos assim que este produto estiver disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 border border-border rounded-sm p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="font-heading font-medium text-foreground">
          Produto em lançamento
        </h3>
        <p className="text-sm text-muted-foreground">
          Inscreva-se aqui para ficar por dentro do lançamento e ter acesso antecipado
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" variant="hero" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Quero saber primeiro"}
        </Button>
      </form>
    </div>
  );
};

export default LaunchLeadForm;
