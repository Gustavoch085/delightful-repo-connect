
import { LayoutDashboard, Users, FileText, DollarSign, Calendar, LogOut, FileX, CalendarDays } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
    permission: "clientes",
  },
  {
    title: "Produtos",
    url: "/produtos",
    icon: FileText,
    permission: "produtos",
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: DollarSign,
    permission: "relatorios",
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: Calendar,
    permission: "orcamentos",
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: CalendarDays,
    permission: "agenda",
  },
  {
    title: "Logs",
    url: "/logs",
    icon: FileX,
    permission: "logs",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
  };

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <Sidebar className="bg-crm-dark border-crm-border">
      <SidebarHeader className="border-b border-crm-border">
        <div className="p-4 flex justify-center">
          <img 
            src="/lovable-uploads/5e33d1c8-1407-4145-b0cd-10aceaa0308a.png" 
            alt="Fortal CRM" 
            className="h-8 w-auto object-contain"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="hover:bg-crm-card text-gray-300 hover:text-white"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-crm-border">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/5e33d1c8-1407-4145-b0cd-10aceaa0308a.png" 
                alt="User Avatar" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role === 'admin' ? 'Administrador' : 'Funcionário'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-crm-card"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
