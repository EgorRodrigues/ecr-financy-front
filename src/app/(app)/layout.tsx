import type { Metadata } from "next";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { FormConfig } from "@/components/layout/form-config";

export const metadata: Metadata = {
  title: "Financy | Gestão",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="md:hidden" />
          <span className="text-sm font-medium">Gestão Financeira</span>
        </div>
        <FormConfig className="p-4 space-y-4">{children}</FormConfig>
      </SidebarInset>
    </SidebarProvider>
  );
}
