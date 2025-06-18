
import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-crm-dark">
        <AppSidebar />
        <main className="flex-1">
          <div className="lg:hidden p-4 border-b border-crm-border bg-crm-dark">
            <SidebarTrigger className="text-white hover:bg-crm-card" />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
