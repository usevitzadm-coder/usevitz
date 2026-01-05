import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Color {
  id: string;
  name: string;
  hex_code: string;
  is_active: boolean;
  display_order: number;
}

export default function AdminColors() {
  const { toast } = useToast();
  const [colors, setColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [hexCode, setHexCode] = useState('#000000');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchColors();
  }, []);

  async function fetchColors() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setColors(data || []);
    } catch (error) {
      console.error('Error fetching colors:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as cores.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function openNewDialog() {
    setEditingColor(null);
    setName('');
    setHexCode('#000000');
    setIsActive(true);
    setIsDialogOpen(true);
  }

  function openEditDialog(color: Color) {
    setEditingColor(color);
    setName(color.name);
    setHexCode(color.hex_code);
    setIsActive(color.is_active);
    setIsDialogOpen(true);
  }

  function openDeleteDialog(color: Color) {
    setColorToDelete(color);
    setIsDeleteDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da cor é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(hexCode)) {
      toast({
        title: 'Erro',
        description: 'Código hexadecimal inválido. Use o formato #RRGGBB.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingColor) {
        const { error } = await supabase
          .from('colors')
          .update({
            name: name.trim(),
            hex_code: hexCode.toUpperCase(),
            is_active: isActive,
          })
          .eq('id', editingColor.id);

        if (error) throw error;

        toast({
          title: 'Cor atualizada',
          description: 'A cor foi atualizada com sucesso.',
        });
      } else {
        const maxOrder = colors.length > 0 
          ? Math.max(...colors.map(c => c.display_order)) + 1 
          : 1;

        const { error } = await supabase
          .from('colors')
          .insert({
            name: name.trim(),
            hex_code: hexCode.toUpperCase(),
            is_active: isActive,
            display_order: maxOrder,
          });

        if (error) throw error;

        toast({
          title: 'Cor criada',
          description: 'A cor foi criada com sucesso.',
        });
      }

      setIsDialogOpen(false);
      fetchColors();
    } catch (error: any) {
      console.error('Error saving color:', error);
      toast({
        title: 'Erro',
        description: error.message?.includes('colors_name_unique') 
          ? 'Já existe uma cor com este nome.'
          : 'Não foi possível salvar a cor.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!colorToDelete) return;

    try {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', colorToDelete.id);

      if (error) throw error;

      toast({
        title: 'Cor excluída',
        description: 'A cor foi excluída com sucesso.',
      });

      setIsDeleteDialogOpen(false);
      setColorToDelete(null);
      fetchColors();
    } catch (error) {
      console.error('Error deleting color:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a cor.',
        variant: 'destructive',
      });
    }
  }

  async function toggleActive(color: Color) {
    try {
      const { error } = await supabase
        .from('colors')
        .update({ is_active: !color.is_active })
        .eq('id', color.id);

      if (error) throw error;

      setColors(colors.map(c => 
        c.id === color.id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch (error) {
      console.error('Error toggling color status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-semibold">Cores</h1>
          <p className="text-muted-foreground">
            Gerencie as cores disponíveis para os produtos
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Cor
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Código Hex</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : colors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma cor cadastrada
                </TableCell>
              </TableRow>
            ) : (
              colors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
                      style={{ backgroundColor: color.hex_code }}
                      title={color.hex_code}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{color.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {color.hex_code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={color.is_active}
                      onCheckedChange={() => toggleActive(color)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(color)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(color)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingColor ? 'Editar Cor' : 'Nova Cor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da cor *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Azul Marinho"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Código hexadecimal *</Label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={hexCode}
                  onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                  className="w-14 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={hexCode}
                  onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                  placeholder="#000000"
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Cor ativa</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Preview */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div 
                className="w-12 h-12 rounded-full border-2 border-border shadow-sm"
                style={{ backgroundColor: hexCode }}
              />
              <div>
                <p className="font-medium">{name || 'Nome da cor'}</p>
                <code className="text-sm text-muted-foreground">{hexCode}</code>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : editingColor ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a cor "{colorToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
