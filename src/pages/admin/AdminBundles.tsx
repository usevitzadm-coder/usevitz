import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Package, Link as LinkIcon, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BundleWithDetails {
  id: string;
  bundle_product_id: string;
  component_product_id: string;
  bundle_product: {
    id: string;
    name: string;
  };
  component_product: {
    id: string;
    name: string;
  };
  variant_links_count: number;
}

export default function AdminBundles() {
  const [bundles, setBundles] = useState<BundleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      // Fetch bundles with product names
      const { data: bundleData, error } = await supabase
        .from('product_bundles')
        .select(`
          id,
          bundle_product_id,
          component_product_id,
          bundle_product:products!product_bundles_bundle_product_id_fkey(id, name),
          component_product:products!product_bundles_component_product_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get variant link counts for each bundle
      const bundlesWithCounts = await Promise.all(
        (bundleData || []).map(async (bundle) => {
          // Get all variant IDs for the bundle product
          const { data: bundleVariants } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', bundle.bundle_product_id);

          if (!bundleVariants?.length) {
            return { ...bundle, variant_links_count: 0 };
          }

          // Count links for these variants
          const { count } = await supabase
            .from('bundle_variant_links')
            .select('*', { count: 'exact', head: true })
            .in('bundle_variant_id', bundleVariants.map(v => v.id));

          return {
            ...bundle,
            variant_links_count: count || 0,
          };
        })
      );

      setBundles(bundlesWithCounts as BundleWithDetails[]);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast.error('Erro ao carregar conjuntos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const handleDelete = async (bundleId: string) => {
    try {
      const { error } = await supabase
        .from('product_bundles')
        .delete()
        .eq('id', bundleId);

      if (error) throw error;

      toast.success('Conjunto removido com sucesso');
      fetchBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast.error('Erro ao remover conjunto');
    }
  };

  // Group bundles by bundle product
  const groupedBundles = bundles.reduce((acc, bundle) => {
    const key = bundle.bundle_product_id;
    if (!acc[key]) {
      acc[key] = {
        bundleProduct: bundle.bundle_product,
        components: [],
        totalLinks: 0,
      };
    }
    acc[key].components.push({
      id: bundle.id,
      product: bundle.component_product,
      linksCount: bundle.variant_links_count,
    });
    acc[key].totalLinks += bundle.variant_links_count;
    return acc;
  }, {} as Record<string, { bundleProduct: { id: string; name: string }; components: Array<{ id: string; product: { id: string; name: string }; linksCount: number }>; totalLinks: number }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Conjuntos</h1>
          <p className="text-muted-foreground">
            Gerencie bundles de produtos com estoque vinculado
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/conjuntos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Conjunto
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundles Cadastrados
          </CardTitle>
          <CardDescription>
            Quando um componente é vendido, o estoque do conjunto é decrementado automaticamente e vice-versa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : Object.keys(groupedBundles).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum conjunto cadastrado</p>
              <p className="text-sm mt-2">
                Crie um conjunto para vincular o estoque de produtos relacionados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto Conjunto</TableHead>
                  <TableHead>Componentes</TableHead>
                  <TableHead>Vínculos de Variantes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedBundles).map(([bundleProductId, group]) => (
                  <TableRow key={bundleProductId}>
                    <TableCell className="font-medium">
                      {group.bundleProduct.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.components.map((comp) => (
                          <Badge key={comp.id} variant="secondary">
                            {comp.product.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{group.totalLinks} vínculos</span>
                        {group.totalLinks === 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Configurar
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/conjuntos/${bundleProductId}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover conjunto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso removerá todos os vínculos de variantes deste conjunto. 
                                O estoque dos produtos não será alterado.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  group.components.forEach((comp) => handleDelete(comp.id));
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
