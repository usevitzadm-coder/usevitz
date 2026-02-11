import { useEffect, useState } from 'react';
import { Package, Tags, FolderTree, AlertTriangle, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalTags: number;
  lowStockCount: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface TopProduct {
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalTags: 0,
    lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [productsRes, categoriesRes, tagsRes, lowStockRes, ordersRes, topRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('tags').select('id', { count: 'exact', head: true }),
          supabase.from('product_variants').select('id', { count: 'exact', head: true }).lt('stock', 5),
          supabase.from('orders').select('id, order_number, customer_name, total, status, payment_status, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('order_items').select('product_name, quantity, total_price'),
        ]);

        setStats({
          totalProducts: productsRes.count || 0,
          totalCategories: categoriesRes.count || 0,
          totalTags: tagsRes.count || 0,
          lowStockCount: lowStockRes.count || 0,
        });

        setRecentOrders((ordersRes.data || []) as RecentOrder[]);

        // Aggregate top products
        const productMap = new Map<string, { total_sold: number; total_revenue: number }>();
        (topRes.data || []).forEach((item: any) => {
          const existing = productMap.get(item.product_name) || { total_sold: 0, total_revenue: 0 };
          existing.total_sold += item.quantity;
          existing.total_revenue += Number(item.total_price);
          productMap.set(item.product_name, existing);
        });
        const sorted = Array.from(productMap.entries())
          .map(([name, data]) => ({ product_name: name, ...data }))
          .sort((a, b) => b.total_sold - a.total_sold)
          .slice(0, 5);
        setTopProducts(sorted);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  function getStatusLabel(status: string) {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      confirmed: { label: 'Confirmado', variant: 'default' },
      shipped: { label: 'Enviado', variant: 'outline' },
      delivered: { label: 'Entregue', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };
    return map[status] || { label: status, variant: 'secondary' as const };
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const statCards = [
    {
      title: 'Produtos',
      value: stats.totalProducts,
      description: 'Total de produtos cadastrados',
      icon: Package,
    },
    {
      title: 'Categorias',
      value: stats.totalCategories,
      description: 'Categorias ativas',
      icon: FolderTree,
    },
    {
      title: 'Tags',
      value: stats.totalTags,
      description: 'Tags cadastradas',
      icon: Tags,
    },
    {
      title: 'Estoque Baixo',
      value: stats.lowStockCount,
      description: 'Variações com menos de 5 unidades',
      icon: AlertTriangle,
      variant: stats.lowStockCount > 0 ? 'warning' : 'default',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu ecommerce Vitz
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className={card.variant === 'warning' && stats.lowStockCount > 0 ? 'border-destructive/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.variant === 'warning' && stats.lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>Últimos pedidos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusInfo = getStatusLabel(order.status);
                  return (
                    <div key={order.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            #{order.order_number} · {format(new Date(order.created_at), "dd/MM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top produtos por quantidade vendida</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda ainda</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.product_name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium truncate">{product.product_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(product.total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">{product.total_sold} un.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
