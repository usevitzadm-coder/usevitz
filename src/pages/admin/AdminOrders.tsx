import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Package, Loader2, RefreshCw, Truck, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_cep: string;
  shipping_neighborhood: string | null;
  subtotal: number;
  shipping_cost: number;
  shipping_method: string | null;
  discount: number;
  coupon_code: string | null;
  gift_card_amount: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_id: string | null;
  tracking_code: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const statusOptions = [
  { value: "pending", label: "Pendente", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmado", color: "bg-blue-500" },
  { value: "processing", label: "Preparando", color: "bg-purple-500" },
  { value: "shipped", label: "Enviado", color: "bg-indigo-500" },
  { value: "delivered", label: "Entregue", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelado", color: "bg-red-500" },
];

const paymentStatusOptions = [
  { value: "pending", label: "Pendente", color: "bg-yellow-500" },
  { value: "approved", label: "Aprovado", color: "bg-green-500" },
  { value: "rejected", label: "Rejeitado", color: "bg-red-500" },
  { value: "refunded", label: "Reembolsado", color: "bg-gray-500" },
];

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [tempTrackingCode, setTempTrackingCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  const sendOrderEmail = async (orderId: string, emailType: string) => {
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!order) return;

      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, variant_info, quantity, unit_price, total_price")
        .eq("order_id", orderId);

      await supabase.functions.invoke("send-email", {
        body: {
          type: emailType,
          to: order.customer_email,
          data: { ...order, items: items || [] },
        },
      });
    } catch (err) {
      console.error(`Failed to send ${emailType} email:`, err);
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, field, value }: { orderId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ [field]: value })
        .eq("id", orderId);

      if (error) throw error;

      // Send email based on status change
      if (field === "status") {
        // "shipped" email is handled by database trigger (only fires when tracking_code is filled)
        const emailMap: Record<string, string> = {
          confirmed: "order_confirmed",
          delivered: "order_delivered",
          cancelled: "order_cancelled",
        };
        if (emailMap[value]) {
          await sendOrderEmail(orderId, emailMap[value]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Status atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: async ({ orderId, trackingCode }: { orderId: string; trackingCode: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ tracking_code: trackingCode || null })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setEditingTrackingId(null);
      setTempTrackingCode("");
      toast({ title: "Código de rastreio atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar código de rastreio", variant: "destructive" });
    },
  });

  const handleSyncPaymentStatus = async (order: Order) => {
    if (!order.payment_id) {
      toast({ title: "Pedido sem ID de pagamento", variant: "destructive" });
      return;
    }

    setSyncingOrderId(order.id);
    try {
      const apiKey = await getApiKeyFromEdgeFunction(order.payment_id);
      if (apiKey) {
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        toast({ title: "Status de pagamento atualizado!" });
      }
    } catch (error) {
      toast({ title: "Erro ao sincronizar status", variant: "destructive" });
    } finally {
      setSyncingOrderId(null);
    }
  };

  const getApiKeyFromEdgeFunction = async (paymentId: string) => {
    const { data, error } = await supabase.functions.invoke("sync-payment-status", {
      body: { paymentId },
    });
    if (error) throw error;
    return data;
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setIsLoadingItems(true);

    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (error) throw error;
      setOrderItems(data as OrderItem[]);
    } catch (error) {
      toast({ title: "Erro ao carregar itens", variant: "destructive" });
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleEditTracking = (order: Order) => {
    setEditingTrackingId(order.id);
    setTempTrackingCode(order.tracking_code || "");
  };

  const handleSaveTracking = (orderId: string) => {
    updateTrackingMutation.mutate({ orderId, trackingCode: tempTrackingCode });
  };

  const handleCancelTracking = () => {
    setEditingTrackingId(null);
    setTempTrackingCode("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusBadge = (status: string, options: typeof statusOptions) => {
    const option = options.find((o) => o.value === status);
    return (
      <Badge className={`${option?.color || "bg-gray-500"} text-white`}>
        {option?.label || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
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
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground text-sm">Gerencie os pedidos da loja</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, nome ou email..."
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
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "Tente ajustar os filtros"
              : "Os pedidos aparecerão aqui quando forem criados"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Rastreio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({ orderId: order.id, field: "status", value })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue>{getStatusBadge(order.status, statusOptions)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusBadge(order.payment_status, paymentStatusOptions)}
                      {order.payment_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleSyncPaymentStatus(order)}
                          disabled={syncingOrderId === order.id}
                          title="Sincronizar com Pagar.me"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncingOrderId === order.id ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingTrackingId === order.id ? (
                      <div className="flex items-center gap-1 max-w-[150px]">
                        <Input
                          value={tempTrackingCode}
                          onChange={(e) => setTempTrackingCode(e.target.value)}
                          placeholder="Código de rastreio"
                          className="h-7 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleSaveTracking(order.id)}
                          disabled={updateTrackingMutation.isPending}
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={handleCancelTracking}
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">
                          {order.tracking_code || "N/A"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditTracking(order)}
                          title="Editar código de rastreio"
                        >
                          <Truck className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Cliente</h4>
                  <p>{selectedOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Endereço de Entrega</h4>
                  <p className="text-sm">
                    {selectedOrder.shipping_address}
                    {selectedOrder.shipping_neighborhood && `, ${selectedOrder.shipping_neighborhood}`}
                  </p>
                  <p className="text-sm">
                    {selectedOrder.shipping_city} - {selectedOrder.shipping_state}
                  </p>
                  <p className="text-sm">CEP: {selectedOrder.shipping_cep}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Itens do Pedido</h4>
                {isLoadingItems ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="text-right">Preço Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <p className="font-medium">{item.product_name}</p>
                              {item.variant_info && (
                                <p className="text-sm text-muted-foreground">{item.variant_info}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatPrice(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{formatPrice(item.total_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto {selectedOrder.coupon_code && `(${selectedOrder.coupon_code})`}</span>
                    <span>-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                {selectedOrder.gift_card_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Gift Card</span>
                    <span>-{formatPrice(selectedOrder.gift_card_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frete {selectedOrder.shipping_method && `(${selectedOrder.shipping_method})`}</span>
                  <span>
                    {selectedOrder.shipping_cost === 0 ? "Grátis" : formatPrice(selectedOrder.shipping_cost)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;