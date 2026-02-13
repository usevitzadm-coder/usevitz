import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isBefore } from 'date-fns';

interface Cost {
  id: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  cash_withdrawn: number;
  created_at: string;
  updated_at: string;
}

type CostForm = {
  description: string;
  category: string;
  amount: string;
  due_date: string;
  paid_date: string;
  payment_method: string;
};

const CATEGORIES = ['Fixo Mensal', 'Fixo Anual', 'Variável'];
const PARTNERS = ['Nelinho', 'Nat', 'Nick', 'Nady', 'Gui'];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return format(parseISO(d), 'dd/MM/yyyy');
};

const emptyCostForm: CostForm = {
  description: '',
  category: 'Variável',
  amount: '',
  due_date: '',
  paid_date: '',
  payment_method: '',
};

export default function AdminCosts() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('contas');
  const [payDialogCost, setPayDialogCost] = useState<Cost | null>(null);
  const [payForm, setPayForm] = useState({ paid_date: '', payment_method: '' });
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CostForm>(emptyCostForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: costs = [], isLoading } = useQuery({
    queryKey: ['costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data as Cost[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Partial<Cost>) => {
      if (editingId) {
        const { error } = await supabase.from('costs').update(values).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('costs').insert(values as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['costs'] });
      toast.success(editingId ? 'Custo atualizado!' : 'Custo criado!');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar custo'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('costs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['costs'] });
      toast.success('Custo excluído!');
      setDeleteId(null);
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ id, paid_date, payment_method }: { id: string; paid_date: string; payment_method: string | null }) => {
      const { error } = await supabase.from('costs').update({ paid_date, payment_method }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['costs'] });
      toast.success('Conta marcada como paga!');
      setPayDialogCost(null);
      setPayForm({ paid_date: '', payment_method: '' });
    },
    onError: () => toast.error('Erro ao registrar pagamento'),
  });

  const cashMutation = useMutation({
    mutationFn: async ({ id, cash_withdrawn }: { id: string; cash_withdrawn: number }) => {
      const { error } = await supabase.from('costs').update({ cash_withdrawn }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['costs'] }),
    onError: () => toast.error('Erro ao atualizar'),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyCostForm);
  };

  const openCreate = () => {
    setForm(emptyCostForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Cost) => {
    setEditingId(c.id);
    setForm({
      description: c.description,
      category: c.category,
      amount: String(c.amount),
      due_date: c.due_date,
      paid_date: c.paid_date ?? '',
      payment_method: c.payment_method ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.description || !form.amount || !form.due_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    upsertMutation.mutate({
      description: form.description,
      category: form.category,
      amount: parseFloat(form.amount),
      due_date: form.due_date,
      paid_date: form.paid_date || null,
      payment_method: form.payment_method || null,
    });
  };

  // Filters
  const filtered = costs.filter((c) => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterStatus === 'pago' && !c.paid_date) return false;
    if (filterStatus === 'pendente' && c.paid_date) return false;
    return true;
  });

  const totalGeral = filtered.reduce((s, c) => s + Number(c.amount), 0);
  const totalPago = filtered.filter((c) => c.paid_date).reduce((s, c) => s + Number(c.amount), 0);
  const totalPendente = totalGeral - totalPago;

  // Investimento tab
  const paidCosts = costs.filter((c) => c.paid_date);
  const investTotal = paidCosts.reduce((s, c) => s + Number(c.amount), 0);
  const investCashTotal = paidCosts.reduce((s, c) => s + Number(c.cash_withdrawn), 0);
  const investPerPartner = (investTotal - investCashTotal) / 5;

  const today = new Date().toISOString().split('T')[0];

  // Contas a pagar: unpaid costs due in current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const contasAPagar = costs.filter((c) => {
    if (c.paid_date) return false;
    const d = parseISO(c.due_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalContas = contasAPagar.reduce((s, c) => s + Number(c.amount), 0);

  const handleMarkPaid = () => {
    if (!payDialogCost || !payForm.paid_date) {
      toast.error('Informe a data de pagamento');
      return;
    }
    markAsPaidMutation.mutate({
      id: payDialogCost.id,
      paid_date: payForm.paid_date,
      payment_method: payForm.payment_method || null,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Controle de Custos</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="contas">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="controle">Controle de Custos</TabsTrigger>
          <TabsTrigger value="investimento">Investimento Realizado</TabsTrigger>
        </TabsList>

        {/* ===== ABA CONTAS A PAGAR ===== */}
        <TabsContent value="contas" className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total a Pagar — {format(now, 'MMMM yyyy')}</p>
            <p className="text-lg font-bold text-red-600">{fmt(totalContas)}</p>
            <p className="text-xs text-muted-foreground mt-1">{contasAPagar.length} conta(s) pendente(s)</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasAPagar.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhuma conta a pagar este mês 🎉</TableCell></TableRow>
                ) : (
                  contasAPagar.map((c) => {
                    const overdue = isBefore(parseISO(c.due_date), new Date());
                    return (
                      <TableRow key={c.id} className={overdue ? 'bg-red-50/50' : ''}>
                        <TableCell className="font-medium max-w-[260px] truncate">{c.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{c.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{fmt(Number(c.amount))}</TableCell>
                        <TableCell className="whitespace-nowrap">{fmtDate(c.due_date)}</TableCell>
                        <TableCell>
                          {overdue ? (
                            <Badge variant="destructive" className="text-xs">Vencida</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">A vencer</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => { setPayDialogCost(c); setPayForm({ paid_date: today, payment_method: '' }); }}>
                            Pagar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ===== ABA CONTROLE ===== */}
        <TabsContent value="controle" className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openCreate} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" /> Novo Custo
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Geral</p>
              <p className="text-lg font-bold">{fmt(totalGeral)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Pago</p>
              <p className="text-lg font-bold text-green-600">{fmt(totalPago)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Pendente</p>
              <p className="text-lg font-bold text-red-600">{fmt(totalPendente)}</p>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Nenhum custo encontrado</TableCell></TableRow>
                ) : (
                  filtered.map((c) => {
                    const overdue = !c.paid_date && isBefore(parseISO(c.due_date), new Date());
                    return (
                      <TableRow key={c.id} className={c.paid_date ? 'bg-green-50/50' : overdue ? 'bg-red-50/50' : ''}>
                        <TableCell className="font-medium max-w-[260px] truncate">{c.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{c.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{fmt(Number(c.amount))}</TableCell>
                        <TableCell className="whitespace-nowrap">{fmtDate(c.due_date)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {c.paid_date ? (
                            <span className="text-green-700">{fmtDate(c.paid_date)}</span>
                          ) : (
                            <span className="text-red-600 text-xs">Pendente</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs">{c.payment_method ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ===== ABA INVESTIMENTO ===== */}
        <TabsContent value="investimento" className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Retirado do Caixa</TableHead>
                  {PARTNERS.map((p) => (
                    <TableHead key={p} className="text-right">{p}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidCosts.length === 0 ? (
                  <TableRow><TableCell colSpan={3 + PARTNERS.length} className="text-center py-8">Nenhum custo pago</TableCell></TableRow>
                ) : (
                  paidCosts.map((c) => {
                    const diff = Number(c.amount) - Number(c.cash_withdrawn);
                    const perPartner = diff / 5;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium max-w-[240px] truncate">{c.description}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{fmt(Number(c.amount))}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 text-right ml-auto"
                            defaultValue={Number(c.cash_withdrawn) || ''}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val !== Number(c.cash_withdrawn)) {
                                cashMutation.mutate({ id: c.id, cash_withdrawn: val });
                              }
                            }}
                          />
                        </TableCell>
                        {PARTNERS.map((p) => (
                          <TableCell key={p} className="text-right whitespace-nowrap">{fmt(perPartner)}</TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{fmt(investTotal)}</TableCell>
                  <TableCell className="text-right font-bold">{fmt(investCashTotal)}</TableCell>
                  {PARTNERS.map((p) => (
                    <TableCell key={p} className="text-right font-bold">{fmt(investPerPartner)}</TableCell>
                  ))}
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Custo' : 'Novo Custo'}</DialogTitle>
            <DialogDescription>Preencha os dados do custo</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vencimento *</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>Pagamento</Label>
                <Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay dialog */}
      <Dialog open={!!payDialogCost} onOpenChange={(o) => { if (!o) setPayDialogCost(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>{payDialogCost?.description} — {payDialogCost ? fmt(Number(payDialogCost.amount)) : ''}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Data de Pagamento *</Label>
              <Input type="date" value={payForm.paid_date} onChange={(e) => setPayForm({ ...payForm, paid_date: e.target.value })} />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Input value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogCost(null)}>Cancelar</Button>
            <Button onClick={handleMarkPaid} disabled={markAsPaidMutation.isPending}>
              {markAsPaidMutation.isPending ? 'Salvando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir custo?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
