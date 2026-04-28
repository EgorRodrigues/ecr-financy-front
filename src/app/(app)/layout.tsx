import type { Metadata } from "next";
import * as React from "react";
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
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b px-4 shrink-0">
          <SidebarTrigger className="md:hidden" />
          <SidebarTrigger className="hidden md:flex" />
          <span className="text-sm font-medium">Gestão Financeira</span>
        </div>
        <FormConfig className="p-4 space-y-4 overflow-auto flex-1 min-w-0">{children}</FormConfig>
      </SidebarInset>
    </SidebarProvider>
  );
}
