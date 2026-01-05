import { useEffect, useState } from 'react';
import { Package, Tags, FolderTree, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalTags: number;
  lowStockCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalTags: 0,
    lowStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, categoriesRes, tagsRes, lowStockRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('tags').select('id', { count: 'exact', head: true }),
          supabase.from('product_variants').select('id', { count: 'exact', head: true }).lt('stock', 5),
        ]);

        setStats({
          totalProducts: productsRes.count || 0,
          totalCategories: categoriesRes.count || 0,
          totalTags: tagsRes.count || 0,
          lowStockCount: lowStockRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Produtos',
      value: stats.totalProducts,
      description: 'Total de produtos cadastrados',
      icon: Package,
      href: '/admin/produtos',
    },
    {
      title: 'Categorias',
      value: stats.totalCategories,
      description: 'Categorias ativas',
      icon: FolderTree,
      href: '/admin/categorias',
    },
    {
      title: 'Tags',
      value: stats.totalTags,
      description: 'Tags cadastradas',
      icon: Tags,
      href: '/admin/tags',
    },
    {
      title: 'Estoque Baixo',
      value: stats.lowStockCount,
      description: 'Variações com menos de 5 unidades',
      icon: AlertTriangle,
      href: '/admin/estoque',
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
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.variant === 'warning' && stats.lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : card.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>
              Últimos pedidos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Módulo de pedidos em desenvolvimento...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>
              Top produtos do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Módulo de analytics em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
