import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Tag {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  usage_count?: number;
}

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (name && !editingTag) {
      setSlug(generateSlug(name));
    }
  }, [name, editingTag]);

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function fetchTags() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get usage counts
      const { data: usages } = await supabase
        .from('product_tags')
        .select('tag_id');

      const usageMap: Record<string, number> = {};
      usages?.forEach(pt => {
        usageMap[pt.tag_id] = (usageMap[pt.tag_id] || 0) + 1;
      });

      const tagsWithUsage = (data || []).map(tag => ({
        ...tag,
        usage_count: usageMap[tag.id] || 0,
      }));

      setTags(tagsWithUsage);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function openDialog(tag?: Tag) {
    if (tag) {
      setEditingTag(tag);
      setName(tag.name);
      setSlug(tag.slug);
      setIsActive(tag.is_active);
    } else {
      setEditingTag(null);
      setName('');
      setSlug('');
      setIsActive(true);
    }
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditingTag(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const data = {
        name: name.trim(),
        slug: slug || generateSlug(name),
        is_active: isActive,
      };

      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update(data)
          .eq('id', editingTag.id);
        if (error) throw error;
        toast({ title: 'Tag atualizada' });
      } else {
        const { error } = await supabase
          .from('tags')
          .insert(data);
        if (error) throw error;
        toast({ title: 'Tag criada' });
      }

      closeDialog();
      fetchTags();
    } catch (error: any) {
      console.error('Error saving tag:', error);
      toast({
        title: 'Erro',
        description: error.code === '23505' 
          ? 'Já existe uma tag com este slug.'
          : 'Não foi possível salvar a tag.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTag) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', deleteTag.id);

      if (error) throw error;

      toast({ title: 'Tag excluída' });
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tag.',
        variant: 'destructive',
      });
    } finally {
      setDeleteTag(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-semibold">Tags</h1>
          <p className="text-muted-foreground">
            Crie tags para organizar seus produtos
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Uso</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma tag cadastrada
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{tag.usage_count} produtos</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={tag.is_active ? 'default' : 'secondary'}>
                      {tag.is_active ? 'Ativa' : 'Inativa'}
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
                        <DropdownMenuItem onClick={() => openDialog(tag)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteTag(tag)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Editar Tag' : 'Nova Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag 
                ? 'Atualize as informações da tag'
                : 'Preencha os dados da nova tag'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome *</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lançamento"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-slug">Slug</Label>
              <Input
                id="tag-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="lancamento"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tag-active">Ativa</Label>
              <Switch
                id="tag-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : (editingTag ? 'Salvar' : 'Criar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tag "{deleteTag?.name}"?
              {deleteTag?.usage_count ? (
                <span className="block mt-2 text-destructive">
                  Atenção: Esta tag está sendo usada em {deleteTag.usage_count} produto(s).
                </span>
              ) : null}
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
