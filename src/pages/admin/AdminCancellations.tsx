import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, XCircle, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CancellationRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    total: number;
    status: string;
    payment_status: string;
    payment_method: string | null;
    created_at: string;
  };
}

const requestStatusOptions = [
  { value: "pending", label: "Pendente", color: "bg-yellow-500" },
  { value: "approved", label: "Aprovado", color: "bg-green-500" },
  { value: "rejected", label: "Recusado", color: "bg-red-500" },
];

const AdminCancellations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-cancellations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cancellation_requests")
        .select("*, orders(order_number, customer_name, customer_email, customer_phone, total, status, payment_status, payment_method, created_at)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CancellationRequest[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status: string; response?: string }) => {
      const updateData: Record<string, string> = { status };
      if (response) updateData.admin_response = response;

      const { error } = await supabase
        .from("cancellation_requests")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cancellations"] });
      toast({ title: "Solicitação atualizada!" });
      setSelectedRequest(null);
      setAdminResponse("");
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const getStatusBadge = (status: string) => {
    const opt = requestStatusOptions.find((o) => o.value === status);
    return <Badge className={`${opt?.color || "bg-gray-500"} text-white`}>{opt?.label || status}</Badge>;
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orders?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orders?.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cancelamentos</h1>
        <p className="text-muted-foreground">Gerencie as solicitações de cancelamento</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {requestStatusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all" ? "Tente ajustar os filtros" : "As solicitações aparecerão aqui"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.orders?.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{req.orders?.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{req.orders?.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                  <TableCell>
                    {format(new Date(req.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedRequest(req);
                      setAdminResponse(req.admin_response || "");
                    }}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitação de Cancelamento</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pedido</span>
                  <span className="font-medium">{selectedRequest.orders?.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cliente</span>
                  <span>{selectedRequest.orders?.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm">{selectedRequest.orders?.customer_email}</span>
                </div>
                {selectedRequest.orders?.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telefone</span>
                    <span className="text-sm">{selectedRequest.orders?.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total do pedido</span>
                  <span className="font-medium">{formatPrice(selectedRequest.orders?.total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Método pagamento</span>
                  <span className="text-sm">{selectedRequest.orders?.payment_method || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Solicitado em</span>
                  <span className="text-sm">
                    {format(new Date(selectedRequest.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Motivo do cancelamento</p>
                <p className="text-sm bg-muted/30 rounded-lg p-3">{selectedRequest.reason}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Resposta do admin</p>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Escreva uma resposta para o cliente..."
                  rows={3}
                />
              </div>

              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button
                  variant="destructive"
                  onClick={() => updateMutation.mutate({ id: selectedRequest.id, status: "rejected", response: adminResponse })}
                  disabled={updateMutation.isPending}
                >
                  Recusar
                </Button>
                <Button
                  onClick={() => updateMutation.mutate({ id: selectedRequest.id, status: "approved", response: adminResponse })}
                  disabled={updateMutation.isPending}
                >
                  Aprovar cancelamento
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCancellations;
