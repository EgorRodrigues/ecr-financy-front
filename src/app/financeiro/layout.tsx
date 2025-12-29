import type { Metadata } from "next";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { FormConfig } from "@/components/layout/form-config";

export const metadata: Metadata = {
  title: "Financy | Financeiro",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Financeiro</span>
        </div>
        <FormConfig className="p-4 space-y-4">{children}</FormConfig>
      </SidebarInset>
    </SidebarProvider>
  );
}
