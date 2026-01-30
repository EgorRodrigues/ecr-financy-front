"use client";

import {
  LineChart,
  Table as TableIcon,
  ReceiptText,
  HandCoins,
  Banknote,
  CreditCard,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarSeparator,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/layout/nav-user";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <Link href="/" className="flex items-center gap-2 px-2 py-2" onClick={handleLinkClick}>
            <ReceiptText className="size-6" />
            <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">Financy</span>
          </Link>
          <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Cartão de Crédito"
                  isActive={pathname === "/cartao-credito"}
                >
                  <Link
                    href="/cartao-credito"
                    onClick={handleLinkClick}
                  >
                    <CreditCard />
                    <span>Cartão de Crédito</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Extrato por Conta"
                  isActive={pathname === "/extrato-conta"}
                >
                  <Link
                    href="/extrato-conta"
                    onClick={handleLinkClick}
                  >
                    <Landmark />
                    <span>Extrato por Conta</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Contas a Pagar"
                  isActive={pathname === "/contas-a-pagar"}
                >
                  <Link
                    href="/contas-a-pagar"
                    onClick={handleLinkClick}
                  >
                    <Banknote />
                    <span>Contas a Pagar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Contas a Receber"
                  isActive={pathname === "/contas-a-receber"}
                >
                  <Link
                    href="/contas-a-receber"
                    onClick={handleLinkClick}
                  >
                    <HandCoins />
                    <span>Contas a Receber</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Previsão Financeira"
                  isActive={pathname === "/relatorios/previsao"}
                >
                  <Link
                    href="/relatorios/previsao"
                    onClick={handleLinkClick}
                  >
                    <LineChart />
                    <span>Previsão Financeira</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="hidden md:flex justify-center p-2 group-data-[collapsible=icon]:p-0">
          <SidebarTrigger className="group-data-[state=expanded]:hidden" />
        </div>
        {user ? (
          <NavUser
            user={{
              name: user.name || "Usuário",
              email: user.email || "",
              avatar: user.avatar_url,
            }}
          />
        ) : (
          <div className="p-2">
            <SidebarMenuSkeleton showIcon />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
