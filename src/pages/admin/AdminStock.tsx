import { useState, useEffect } from 'react';
import { Search, Plus, Minus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface VariantWithProduct {
  id: string;
  size: string;
  color: string;
  color_hex: string;
  sku: string;
  stock: number;
  is_active: boolean;
  product: {
    id: string;
    name: string;
  };
}

type StockFilter = 'all' | 'low' | 'out' | 'ok';

export default function AdminStock() {
  const [variants, setVariants] = useState<VariantWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [adjustVariant, setAdjustVariant] = useState<VariantWithProduct | null>(null);
  const [adjustType, setAdjustType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchVariants();
  }, [stockFilter]);

  async function fetchVariants() {
    setIsLoading(true);
    try {
      let query = supabase
        .from('product_variants')
        .select(`
          id,
          size,
          color,
          color_hex,
          sku,
          stock,
          is_active,
          product:products(id, name)
        `)
        .order('stock', { ascending: true });

      if (stockFilter === 'out') {
        query = query.eq('stock', 0);
      } else if (stockFilter === 'low') {
        query = query.gt('stock', 0).lt('stock', 5);
      } else if (stockFilter === 'ok') {
        query = query.gte('stock', 5);
      }

      const { data, error } = await query;

      if (error) throw error;

      let result = (data || []) as VariantWithProduct[];

      // Client-side search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(v => 
          v.product?.name?.toLowerCase().includes(query) ||
          v.sku?.toLowerCase().includes(query) ||
          v.color.toLowerCase().includes(query) ||
          v.size.toLowerCase().includes(query)
        );
      }

      setVariants(result);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o estoque.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function openAdjustDialog(variant: VariantWithProduct) {
    setAdjustVariant(variant);
    setAdjustType('entrada');
    setAdjustQuantity('');
    setAdjustReason('');
  }

  function closeAdjustDialog() {
    setAdjustVariant(null);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();

    if (!adjustVariant) return;

    const quantity = parseInt(adjustQuantity);
    if (!quantity || quantity <= 0) {
      toast({
        title: 'Erro',
        description: 'Quantidade deve ser maior que 0.',
        variant: 'destructive',
      });
      return;
    }

    let newStock = adjustVariant.stock;
    let movementQuantity = quantity;

    if (adjustType === 'entrada') {
      newStock += quantity;
    } else if (adjustType === 'saida') {
      if (quantity > adjustVariant.stock) {
        toast({
          title: 'Erro',
          description: 'Quantidade de saída maior que o estoque disponível.',
          variant: 'destructive',
        });
        return;
      }
      newStock -= quantity;
      movementQuantity = -quantity;
    } else {
      // ajuste direto
      newStock = quantity;
      movementQuantity = quantity - adjustVariant.stock;
    }

    setIsSaving(true);

    try {
      // Update variant stock
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', adjustVariant.id);

      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          variant_id: adjustVariant.id,
          quantity: movementQuantity,
          type: adjustType,
          reason: adjustReason || null,
          created_by: user?.id,
        });

      if (movementError) throw movementError;

      toast({
        title: 'Estoque atualizado',
        description: `Novo estoque: ${newStock} unidades`,
      });

      closeAdjustDialog();
      fetchVariants();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ajustar o estoque.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function getStockBadge(stock: number) {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Sem estoque
        </Badge>
      );
    }
    if (stock < 5) {
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="h-3 w-3" />
          Baixo ({stock})
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {stock}
      </Badge>
    );
  }

  const stats = {
    total: variants.length,
    outOfStock: variants.filter(v => v.stock === 0).length,
    lowStock: variants.filter(v => v.stock > 0 && v.stock < 5).length,
    ok: variants.filter(v => v.stock >= 5).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold">Estoque</h1>
        <p className="text-muted-foreground">
          Controle o estoque das variações de produtos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <button
          onClick={() => setStockFilter('all')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            stockFilter === 'all' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
          }`}
        >
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </button>
        <button
          onClick={() => setStockFilter('out')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            stockFilter === 'out' ? 'border-destructive bg-destructive/5' : 'hover:border-destructive/50'
          }`}
        >
          <p className="text-sm text-muted-foreground">Sem estoque</p>
          <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
        </button>
        <button
          onClick={() => setStockFilter('low')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            stockFilter === 'low' ? 'border-yellow-500 bg-yellow-500/5' : 'hover:border-yellow-500/50'
          }`}
        >
          <p className="text-sm text-muted-foreground">Estoque baixo</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
        </button>
        <button
          onClick={() => setStockFilter('ok')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            stockFilter === 'ok' ? 'border-green-500 bg-green-500/5' : 'hover:border-green-500/50'
          }`}
        >
          <p className="text-sm text-muted-foreground">OK</p>
          <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto, SKU, cor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Variação</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma variação encontrada
                </TableCell>
              </TableRow>
            ) : (
              variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">
                    {variant.product?.name || 'Produto removido'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: variant.color_hex }}
                      />
                      <span>{variant.color} / {variant.size}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {variant.sku}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockBadge(variant.stock)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                      {variant.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAdjustDialog(variant)}
                    >
                      Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!adjustVariant} onOpenChange={() => closeAdjustDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              {adjustVariant?.product?.name} - {adjustVariant?.color} / {adjustVariant?.size}
              <br />
              Estoque atual: <strong>{adjustVariant?.stock}</strong> unidades
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de movimentação</Label>
              <Select value={adjustType} onValueChange={(v: any) => setAdjustType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      Entrada
                    </div>
                  </SelectItem>
                  <SelectItem value="saida">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Saída
                    </div>
                  </SelectItem>
                  <SelectItem value="ajuste">Ajuste direto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {adjustType === 'ajuste' ? 'Novo estoque' : 'Quantidade'}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: Reposição de estoque, venda manual..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAdjustDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
