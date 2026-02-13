
-- Create costs table
CREATE TABLE public.costs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  payment_method text,
  cash_withdrawn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage costs" ON public.costs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_costs_updated_at BEFORE UPDATE ON public.costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Import historical data
INSERT INTO public.costs (description, category, amount, due_date, paid_date, payment_method) VALUES
('Pedido fornecedor nº1 (75 pcs) 1/4', 'Variável', 1824.71, '2025-03-05', '2025-03-05', 'Cartão de Crédito (Nat Santander)'),
('DAS MEI - MAR', 'Fixo Mensal', 76.90, '2025-03-20', '2025-03-26', 'Boleto'),
('Site Wix', 'Fixo Anual', 192.00, '2025-03-25', '2025-03-25', 'Cartão de Crédito (Nelinho Bradesco)'),
('Registro Privado + DNSSEC', 'Fixo Anual', 67.00, '2025-03-25', '2025-03-25', 'Cartão de Crédito (Nelinho Bradesco)'),
('Frete pedido fornecedor nº1', 'Variável', 50.00, '2025-04-05', '2025-04-05', 'Cartão de Crédito (Nat Santander)'),
('Uber ida e volta pedido fornecedor nº1', 'Variável', 92.69, '2025-04-05', '2025-04-05', 'Cartão de Crédito (Nat Santander)'),
('Pedido nº1 fornecedor (75 pcs) 2/4', 'Variável', 1824.71, '2025-04-05', '2025-04-05', 'Cartão de Crédito (Nat Santander)'),
('DAS MEI - ABR', 'Fixo Mensal', 76.90, '2025-04-22', '2025-04-22', 'Boleto'),
('Sacos ZipLock', 'Variável', 99.87, '2025-04-25', '2025-04-23', 'Cartão de Crédito (Nelinho Bradesco)'),
('Lacre de etiqueta', 'Variável', 29.45, '2025-04-25', '2025-04-23', 'Cartão de Crédito (Nelinho Bradesco)'),
('Frete pedido nº1 parte 2', 'Variável', 110.00, '2025-04-25', '2025-04-23', 'Cartão de Crédito (Nelinho Bradesco)'),
('Pedido nº1 fornecedor (75 pcs) 3/4', 'Variável', 1824.71, '2025-05-15', '2025-05-20', 'Cartão de Crédito (Nat Santander)'),
('DAS MEI - MAIO', 'Fixo Mensal', 76.90, '2025-05-20', '2025-05-20', 'Boleto'),
('Pedido nº1 fornecedor (75 pcs) 4/4', 'Variável', 1824.71, '2025-06-15', '2025-05-20', 'Cartão de Crédito (Nat Santander)'),
('Sacos ZipLock + Embalagem de envio', 'Variável', 109.79, '2025-06-15', '2025-05-20', 'Cartão de Crédito (Nat Santander)'),
('Caixa de envio pedidos Gabi e Emily', 'Variável', 31.20, '2025-06-15', '2025-05-20', 'Cartão de Crédito (Nat Santander)'),
('Recarga Chip', 'Variável', 20.00, '2025-06-17', '2025-06-17', 'Pix'),
('Frete pedido nº 10006', 'Variável', 19.96, '2025-06-18', '2025-06-18', 'Pix'),
('Frete pedido nº 10007', 'Variável', 12.50, '2025-06-18', '2025-06-18', 'Pix'),
('DAS MEI - JUNHO', 'Fixo Mensal', 76.90, '2025-06-20', '2025-06-18', 'Boleto'),
('Novo teste Fornecedor CDG (5 pcs)', 'Variável', 529.00, '2025-07-15', '2025-07-16', 'Cartão de Crédito (Nat Santander)'),
('Frete pedido nº 10009', 'Variável', 28.09, '2025-06-25', '2025-06-25', 'Pix'),
('Impressão Flyer (Parabens + DripCoffee)', 'Variável', 164.75, '2025-06-27', '2025-06-27', 'Pix'),
('DAS MEI - JULHO', 'Fixo Mensal', 76.90, '2025-07-21', '2025-07-21', 'Pix'),
('50% Ecobags Vitz (50uni.) 1/2', 'Variável', 308.00, '2025-07-31', '2025-07-31', 'Pix'),
('50% Bonés Vitz (40uni.) 1/2', 'Variável', 400.00, '2025-07-24', '2025-07-24', 'Pix'),
('Envio Presskit Influ Sueli (ElascorremDF)', 'Variável', 15.91, '2025-09-08', '2025-09-08', 'Pix'),
('Envio Presskit Influ Carolina Brito', 'Variável', 24.41, '2025-09-08', '2025-09-08', 'Pix'),
('Envio Presskit influ Lorrayne', 'Variável', 28.85, '2025-09-08', '2025-09-08', 'Pix'),
('Envio Presskit influ Nicolle', 'Variável', 28.53, '2025-09-08', '2025-09-08', 'Pix'),
('Envio Presskit influ Gabrielle', 'Variável', 28.53, '2025-09-08', '2025-09-08', 'Pix'),
('Envio Presskit influ Dani Possamai', 'Variável', 34.09, '2025-09-08', '2025-09-08', 'Pix'),
('50% Ecobags Vitz (50uni.) 2/2', 'Variável', 308.01, '2025-08-20', '2025-08-20', 'Cartão de Crédito (Nelinho Itau)'),
('50% Bonés Vitz (40uni.) 2/2', 'Variável', 432.81, '2025-08-20', '2025-08-20', 'Cartão de Crédito (Nelinho Itau)'),
('Cartas Presskit Influencers', 'Variável', 49.80, '2025-08-22', '2025-08-22', 'Cartão de Crédito (Nelinho Itau)'),
('Frete pedido nº10010', 'Variável', 43.90, '2025-08-27', '2025-08-27', 'Pix Nelinho'),
('DAS MEI - AGOSTO', 'Fixo Mensal', 83.00, '2025-08-20', '2025-09-20', 'Pix'),
('DAS MEI - SETEMBRO', 'Fixo Mensal', 76.90, '2025-09-20', '2025-09-20', 'Pix'),
('Caixa de envio dos Presskits influ', 'Variável', 58.16, '2025-09-15', '2025-09-15', 'Cartão de Crédito (Nat Santander)'),
('Frete pedido nº10011', 'Variável', 14.94, '2025-12-15', '2025-12-15', 'Cartão de Crédito (Nat Santander)'),
('DAS MEI - OUTUBRO', 'Fixo Mensal', 89.90, '2025-10-20', '2025-12-04', 'Pix'),
('DAS MEI - NOVEMBRO', 'Fixo Mensal', 80.47, '2025-11-20', '2025-12-04', 'Pix'),
('DAS MEI - DEZEMBRO', 'Fixo Mensal', 76.90, '2025-12-04', '2025-12-04', 'Pix'),
('Recarga Chip', 'Variável', 20.00, '2025-11-25', '2025-12-01', 'Pix nelinho'),
('Pedido teste camisetas', 'Variável', 94.63, '2025-12-15', '2025-12-15', 'Pix Natália'),
('Pedido fornecedor nº2 1/6', 'Variável', 1993.17, '2025-12-15', '2025-12-15', 'Cartão de Crédito (Nat Santander)'),
('Pedido fornecedor nº2 2/6', 'Variável', 1993.17, '2026-01-15', '2026-01-15', 'Cartão de Crédito (Nat Santander)'),
('Pedido fornecedor nº2 3/6', 'Variável', 1993.17, '2026-02-15', NULL, NULL),
('Pedido fornecedor nº2 4/6', 'Variável', 1993.17, '2026-03-15', NULL, NULL),
('Pedido fornecedor nº2 5/6', 'Variável', 1993.17, '2026-04-15', NULL, NULL),
('Pedido fornecedor nº2 6/6', 'Variável', 1993.17, '2026-05-15', NULL, NULL),
('Etiquetas pedido fornecedor nº2', 'Variável', 138.27, '2025-11-27', '2025-12-01', 'Pix nelinho + natalia'),
('Produção novo site (lovable)', 'Variável', 140.00, '2026-01-25', NULL, 'Cartão de Crédito (Nelinho Bradesco)'),
('DAS MEI - JANEIRO', 'Fixo Mensal', 76.90, '2026-01-20', '2026-01-20', 'Pix nelinho'),
('Caixas organizadoras', 'Variável', 112.20, '2026-12-17', '2026-12-17', 'Pix'),
('Ferro tranfer', 'Variável', 101.89, '2026-12-17', '2026-12-17', 'Pix'),
('Frete pedido nº10014', 'Variável', 21.95, '2026-12-07', '2026-12-07', 'Pix nelinho'),
('Frete pedido nº10015', 'Variável', 32.94, '2026-12-11', '2026-12-11', 'Pix nelinho'),
('Transferência de Dominio', 'Variável', 56.08, '2026-02-06', '2026-02-06', 'Pix'),
('Produção novo site (lovable)', 'Variável', 70.00, '2026-02-07', '2026-02-07', 'Pix');
