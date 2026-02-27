import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, Megaphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Contact {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface Lead {
  email: string;
  source: string;
  source_label: string;
  created_at: string;
  product_name?: string;
}

const sourceLabels: Record<string, string> = {
  footer_cupom_primeira_compra: "Cupom 1ª Compra",
  launch_lead: "Lançamento",
};

const AdminContacts = () => {
  const [contactSearch, setContactSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contact[];
    },
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      // Fetch newsletter leads
      const { data: newsletterData, error: nlError } = await supabase
        .from("newsletter_leads")
        .select("email, source, created_at")
        .order("created_at", { ascending: false });
      if (nlError) throw nlError;

      // Fetch launch leads with product name
      const { data: launchData, error: llError } = await supabase
        .from("launch_leads")
        .select("email, created_at, product_id, products(name)")
        .order("created_at", { ascending: false });
      if (llError) throw llError;

      const allLeads: Lead[] = [];

      for (const nl of newsletterData || []) {
        allLeads.push({
          email: nl.email,
          source: nl.source,
          source_label: sourceLabels[nl.source] || nl.source,
          created_at: nl.created_at,
        });
      }

      for (const ll of launchData || []) {
        const productName = (ll as any).products?.name;
        allLeads.push({
          email: ll.email,
          source: "launch_lead",
          source_label: "Lançamento",
          created_at: ll.created_at,
          product_name: productName || undefined,
        });
      }

      // Deduplicate by email, keeping the earliest entry and merging sources
      const emailMap = new Map<string, Lead>();
      for (const lead of allLeads) {
        if (!emailMap.has(lead.email)) {
          emailMap.set(lead.email, lead);
        }
      }

      // Sort by date desc
      return allLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  const filteredContacts = contacts.filter(
    (c) =>
      (c.email?.toLowerCase() || "").includes(contactSearch.toLowerCase()) ||
      (c.full_name?.toLowerCase() || "").includes(contactSearch.toLowerCase())
  );

  const filteredLeads = leads.filter((l) =>
    l.email.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const exportCSV = (type: "contacts" | "leads") => {
    let csv = "";
    if (type === "contacts") {
      csv = "Nome,Email,Data de Cadastro\n";
      filteredContacts.forEach((c) => {
        csv += `"${c.full_name || ""}","${c.email || ""}","${format(new Date(c.created_at), "dd/MM/yyyy")}"\n`;
      });
    } else {
      csv = "Email,Origem,Produto,Data\n";
      filteredLeads.forEach((l) => {
        csv += `"${l.email}","${l.source_label}","${l.product_name || ""}","${format(new Date(l.created_at), "dd/MM/yyyy")}"\n`;
      });
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-vitz-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Contatos & Leads</h1>
        <p className="text-muted-foreground">Gerencie seus contatos cadastrados e leads capturados</p>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="h-4 w-4" />
            Contatos ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Leads ({leads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV("contacts")}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {loadingContacts ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Nenhum contato encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.full_name || "—"}</TableCell>
                        <TableCell>{contact.email || "—"}</TableCell>
                        <TableCell>{format(new Date(contact.created_at), "dd/MM/yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por e-mail..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV("leads")}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {loadingLeads ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead, idx) => (
                      <TableRow key={`${lead.email}-${idx}`}>
                        <TableCell className="font-medium">{lead.email}</TableCell>
                        <TableCell>
                          <Badge variant={lead.source === "launch_lead" ? "default" : "secondary"}>
                            {lead.source_label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lead.product_name || "—"}
                        </TableCell>
                        <TableCell>{format(new Date(lead.created_at), "dd/MM/yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContacts;
