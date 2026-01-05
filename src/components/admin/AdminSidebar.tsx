import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  FolderTree, 
  Boxes, 
  ShoppingCart, 
  Ticket, 
  Settings,
  ChevronLeft
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
  { title: 'Estoque', url: '/admin/estoque', icon: Boxes },
];

const otherNavItems = [
  { title: 'Pedidos', url: '/admin/pedidos', icon: ShoppingCart, disabled: true },
  { title: 'Cupons', url: '/admin/cupons', icon: Ticket, disabled: true },
  { title: 'Configurações', url: '/admin/configuracoes', icon: Settings, disabled: true },
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
                    disabled={item.disabled}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    {item.disabled ? (
                      <span className="opacity-50 cursor-not-allowed flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {!collapsed && (
                          <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                            Em breve
                          </span>
                        )}
                      </span>
                    ) : (
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    )}
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
