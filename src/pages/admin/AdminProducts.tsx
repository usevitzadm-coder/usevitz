import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  is_active: boolean;
  is_coming_soon: boolean;
  badge: string | null;
  display_order: number;
  category: { id: string; name: string } | null;
  images: { url: string; is_primary: boolean }[];
  variants: { stock: number }[];
  tags: { tag: { id: string; name: string } }[];
}

interface Category {
  id: string;
  name: string;
}

function getTotalStock(variants: { stock: number }[]) {
  return variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
}

function getPrimaryImage(images: { url: string; is_primary: boolean }[]) {
  const primary = images?.find(img => img.is_primary);
  return primary?.url || images?.[0]?.url || '/placeholder.svg';
}

// Sortable row component
function SortableRow({
  product,
  showOrder,
  onToggleStatus,
  onDelete,
  onEdit,
}: {
  product: Product;
  showOrder: boolean;
  onToggleStatus: (p: Product) => void;
  onDelete: (p: Product) => void;
  onEdit: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalStock = getTotalStock(product.variants);

  return (
    <TableRow ref={setNodeRef} style={style}>
      {showOrder && (
        <TableCell>
          <button
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </TableCell>
      )}
      <TableCell>
        <img
          src={getPrimaryImage(product.images)}
          alt={product.name}
          className="w-10 h-10 object-cover rounded"
        />
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{product.name}</p>
          {product.badge && (
            <Badge variant="secondary" className="text-xs mt-1">
              {product.badge}
            </Badge>
          )}
          {product.is_coming_soon && (
            <Badge variant="outline" className="text-xs mt-1 border-primary text-primary">
              Em breve
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{product.category?.name || '-'}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {product.tags?.slice(0, 2).map((t) => (
            <Badge key={t.tag.id} variant="outline" className="text-xs">
              {t.tag.name}
            </Badge>
          ))}
          {product.tags?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{product.tags.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        R$ {Number(product.price).toFixed(2)}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={totalStock < 5 ? 'destructive' : totalStock < 20 ? 'secondary' : 'default'}>
          {totalStock}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={product.is_active ? 'default' : 'secondary'}>
          {product.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(product)}>
              {product.is_active ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Desativar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Ativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(product)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('display_order');
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [categoryFilter, sortBy]);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, slug, price, is_active, is_coming_soon, badge, display_order,
          category:categories(id, name),
          images:product_images(url, is_primary),
          variants:product_variants(stock),
          tags:product_tags(tag:tags(id, name))
        `);

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      if (sortBy === 'display_order') {
        query = query.order('display_order', { ascending: true });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'low_stock') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];

      if (searchQuery) {
        result = result.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (sortBy === 'low_stock') {
        result = result.sort((a, b) => {
          const aStock = a.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
          const bStock = b.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
          return aStock - bStock;
        });
      }

      setProducts(result as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os produtos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  }

  async function handleDelete() {
    if (!deleteProduct) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteProduct.id);
      if (error) throw error;
      toast({ title: 'Produto excluído', description: 'O produto foi excluído com sucesso.' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir o produto.', variant: 'destructive' });
    } finally {
      setDeleteProduct(null);
    }
  }

  async function toggleStatus(product: Product) {
    try {
      const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
      if (error) throw error;
      toast({ title: product.is_active ? 'Produto desativado' : 'Produto ativado' });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o produto.', variant: 'destructive' });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex(p => p.id === active.id);
    const newIndex = products.findIndex(p => p.id === over.id);

    const reordered = arrayMove(products, oldIndex, newIndex);
    setProducts(reordered); // optimistic update

    try {
      // Batch update all display_order values
      const updates = reordered.map((p, i) => ({
        id: p.id,
        display_order: i,
      }));

      for (const u of updates) {
        const { error } = await supabase
          .from('products')
          .update({ display_order: u.display_order })
          .eq('id', u.id);
        if (error) throw error;
      }

      toast({ title: 'Ordem atualizada' });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a ordem.', variant: 'destructive' });
      fetchProducts(); // rollback
    }
  }

  const showOrder = sortBy === 'display_order';
  const colSpan = showOrder ? 9 : 8;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-semibold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie os produtos da sua loja</p>
        </div>
        <Button onClick={() => navigate('/admin/produtos/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="display_order">Ordem de exibição</SelectItem>
            <SelectItem value="newest">Mais recentes</SelectItem>
            <SelectItem value="oldest">Mais antigos</SelectItem>
            <SelectItem value="low_stock">Estoque baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {showOrder && <TableHead className="w-14"></TableHead>}
              <TableHead className="w-12"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            </TableBody>
          ) : products.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            </TableBody>
          ) : showOrder ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {products.map((product) => (
                    <SortableRow
                      key={product.id}
                      product={product}
                      showOrder={showOrder}
                      onToggleStatus={toggleStatus}
                      onDelete={setDeleteProduct}
                      onEdit={(id) => navigate(`/admin/produtos/${id}`)}
                    />
                  ))}
                </TableBody>
              </SortableContext>
            </DndContext>
          ) : (
            <TableBody>
              {products.map((product) => (
                <SortableRow
                  key={product.id}
                  product={product}
                  showOrder={showOrder}
                  onToggleStatus={toggleStatus}
                  onDelete={setDeleteProduct}
                  onEdit={(id) => navigate(`/admin/produtos/${id}`)}
                />
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{deleteProduct?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
