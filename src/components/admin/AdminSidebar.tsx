import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  FolderTree, 
  Boxes, 
  ShoppingCart, 
  Ticket, 
  Settings,
  ChevronLeft,
  Gift,
  Palette,
  XCircle,
  DollarSign
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Produtos', url: '/admin/produtos', icon: Package },
  { title: 'Categorias', url: '/admin/categorias', icon: FolderTree },
  { title: 'Tags', url: '/admin/tags', icon: Tags },
  { title: 'Cores', url: '/admin/cores', icon: Palette },
  { title: 'Estoque', url: '/admin/estoque', icon: Boxes },
  { title: 'Gift Cards', url: '/admin/gift-cards', icon: Gift },
];

const otherNavItems = [
  { title: 'Pedidos', url: '/admin/pedidos', icon: ShoppingCart },
  { title: 'Cancelamentos', url: '/admin/cancelamentos', icon: XCircle },
  { title: 'Cupons', url: '/admin/cupons', icon: Ticket },
  { title: 'Custos', url: '/admin/custos', icon: DollarSign },
  { title: 'Configurações', url: '/admin/configuracoes', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <span className="font-heading text-xl font-semibold text-foreground">
              Vitz Admin
            </span>
          )}
          <SidebarTrigger className="ml-auto">
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )} />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.end)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} end={item.end}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Outros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
