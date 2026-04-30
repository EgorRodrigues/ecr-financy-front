"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { isMobile, setOpenMobile, state } = useSidebar();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed" && !isMobile;

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
              size={isCollapsed ? "default" : "lg"}
              tooltip={isCollapsed ? user.name : undefined}
              className={
                isCollapsed
                  ? "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground justify-center"
                  : "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-14 px-3 gap-3"
              }
            >
              <div
                className={
                  isCollapsed
                    ? "h-8 w-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shrink-0"
                    : "h-10 w-10 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shrink-0"
                }
              >
                <User className={isCollapsed ? "h-4 w-4" : "h-5 w-5"} />
              </div>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-snug min-w-0">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </>
              )}
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
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
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
