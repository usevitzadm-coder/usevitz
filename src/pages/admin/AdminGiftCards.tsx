import { useState, useEffect } from "react";
import { Gift, Search, Eye, Ban, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface GiftCard {
  id: string;
  code: string;
  initial_value: number;
  current_balance: number;
  purchaser_email: string;
  purchaser_name: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  recipient_message: string | null;
  send_to_recipient: boolean;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  notes: string | null;
  created_at: string;
}

const AdminGiftCards = () => {
  const { toast } = useToast();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchGiftCards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGiftCards(data || []);
    } catch (error: any) {
      console.error("Error fetching gift cards:", error);
      toast({
        title: "Erro ao carregar gift cards",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (giftCardId: string) => {
    try {
      const { data, error } = await supabase
        .from("gift_card_transactions")
        .select("*")
        .eq("gift_card_id", giftCardId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
    }
  };

  const toggleStatus = async (giftCard: GiftCard) => {
    try {
      const { error } = await supabase
        .from("gift_cards")
        .update({ is_active: !giftCard.is_active })
        .eq("id", giftCard.id);

      if (error) throw error;

      toast({
        title: giftCard.is_active ? "Gift card desativado" : "Gift card ativado",
      });
      fetchGiftCards();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openDetails = async (card: GiftCard) => {
    setSelectedCard(card);
    await fetchTransactions(card.id);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const filteredCards = giftCards.filter(
    (card) =>
      card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.purchaser_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gift Cards</h1>
          <p className="text-muted-foreground">Gerencie os gift cards vendidos</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por código ou email..."
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <Gift className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum gift card encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono text-sm">{card.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{card.purchaser_name || "-"}</p>
                      <p className="text-sm text-muted-foreground">{card.purchaser_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {card.send_to_recipient ? (
                      <div>
                        <p className="font-medium">{card.recipient_name || "-"}</p>
                        <p className="text-sm text-muted-foreground">{card.recipient_email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Mesmo comprador</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(card.initial_value)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(card.current_balance)}
                  </TableCell>
                  <TableCell>
                    <span className={isExpired(card.expires_at) ? "text-destructive" : ""}>
                      {formatDate(card.expires_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {!card.is_active ? (
                      <Badge variant="secondary">Inativo</Badge>
                    ) : isExpired(card.expires_at) ? (
                      <Badge variant="destructive">Expirado</Badge>
                    ) : card.current_balance === 0 ? (
                      <Badge variant="outline">Usado</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetails(card)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(card)}
                      >
                        {card.is_active ? (
                          <Ban className="w-4 h-4 text-destructive" />
                        ) : (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Gift Card</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="font-mono text-lg font-bold">{selectedCard.code}</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {formatPrice(selectedCard.current_balance)}
                </p>
                <p className="text-sm text-muted-foreground">
                  de {formatPrice(selectedCard.initial_value)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Comprador</p>
                  <p className="font-medium">{selectedCard.purchaser_name}</p>
                  <p>{selectedCard.purchaser_email}</p>
                </div>
                {selectedCard.send_to_recipient && (
                  <div>
                    <p className="text-muted-foreground">Destinatário</p>
                    <p className="font-medium">{selectedCard.recipient_name}</p>
                    <p>{selectedCard.recipient_email}</p>
                  </div>
                )}
              </div>

              {selectedCard.recipient_message && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mensagem</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedCard.recipient_message}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Histórico de transações</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma transação</p>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded"
                      >
                        <div>
                          <span className="capitalize">{tx.type}</span>
                          {tx.notes && (
                            <p className="text-xs text-muted-foreground">{tx.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={
                              tx.type === "purchase" || tx.type === "refund"
                                ? "text-green-600"
                                : "text-destructive"
                            }
                          >
                            {tx.type === "redemption" ? "-" : "+"}
                            {formatPrice(tx.amount)}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGiftCards;
