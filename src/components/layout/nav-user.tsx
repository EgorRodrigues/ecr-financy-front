"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings, User, Table as TableIcon, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { signOut } = useAuth();
  const [cadastrosOpen, setCadastrosOpen] = useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] min-w-56 rounded-lg p-0"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="p-2 text-sm">
              <div className="flex items-center gap-2 p-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
              <div className="h-px bg-border my-1" />
              <Link href="/configuracoes" onClick={handleLinkClick}>
                <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </div>
              </Link>
              
              <div 
                className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer select-none"
                onClick={() => setCadastrosOpen(!cadastrosOpen)}
              >
                <div className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  <span>Cadastros</span>
                </div>
                {cadastrosOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
              
              {cadastrosOpen && (
                <div className="ml-4 border-l border-border pl-2 space-y-1 mt-1 mb-1">
                  <Link href="/cadastros/categoria" onClick={handleLinkClick}>
                    <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-xs">
                      <span>Categoria</span>
                    </div>
                  </Link>
                  <Link href="/cadastros/subcategoria" onClick={handleLinkClick}>
                    <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-xs">
                      <span>Subcategoria</span>
                    </div>
                  </Link>
                  <Link href="/cadastros/centro-de-custos" onClick={handleLinkClick}>
                    <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-xs">
                      <span>Centro de Custos</span>
                    </div>
                  </Link>
                  <Link href="/cadastros/fornecedores-clientes" onClick={handleLinkClick}>
                    <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-xs">
                      <span>Fornecedores/Clientes</span>
                    </div>
                  </Link>
                  <Link href="/cadastros/contas" onClick={handleLinkClick}>
                    <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-xs">
                      <span>Contas</span>
                    </div>
                  </Link>
                </div>
              )}

              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-destructive text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
