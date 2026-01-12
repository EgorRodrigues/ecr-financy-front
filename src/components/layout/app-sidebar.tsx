"use client";

import {
  Home,
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
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/layout/nav-user";
import { SearchForm } from "@/components/layout/search-form";
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
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <ReceiptText className="size-6" />
          <span className="text-base font-semibold">Financy</span>
        </div>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Financeiro"
                  isActive={pathname === "/financeiro"}
                >
                  <Link href="/financeiro" onClick={handleLinkClick}>
                    <Home />
                    <span>Financeiro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Cartão de Crédito"
                  isActive={pathname === "/financeiro/cartao-credito"}
                >
                  <Link
                    href="/financeiro/cartao-credito"
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
                  isActive={pathname === "/financeiro/extrato-conta"}
                >
                  <Link
                    href="/financeiro/extrato-conta"
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
                  isActive={pathname === "/financeiro/contas-a-pagar"}
                >
                  <Link
                    href="/financeiro/contas-a-pagar"
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
                  isActive={pathname === "/financeiro/contas-a-receber"}
                >
                  <Link
                    href="/financeiro/contas-a-receber"
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
                  tooltip="Relatórios de Despesas"
                  isActive={pathname === "/financeiro/relatorios/despesas"}
                >
                  <Link
                    href="/financeiro/relatorios/despesas"
                    onClick={handleLinkClick}
                  >
                    <LineChart />
                    <span>Relatórios Despesas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Previsão Financeira"
                  isActive={pathname === "/financeiro/relatorios/previsao"}
                >
                  <Link
                    href="/financeiro/relatorios/previsao"
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Categoria"
                  isActive={pathname === "/financeiro/cadastros/categoria"}
                >
                  <Link
                    href="/financeiro/cadastros/categoria"
                    onClick={handleLinkClick}
                  >
                    <TableIcon />
                    <span>Categoria</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Subcategoria"
                  isActive={pathname === "/financeiro/cadastros/subcategoria"}
                >
                  <Link
                    href="/financeiro/cadastros/subcategoria"
                    onClick={handleLinkClick}
                  >
                    <TableIcon />
                    <span>Subcategoria</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Centro de Custos"
                  isActive={pathname === "/financeiro/cadastros/centro-de-custos"}
                >
                  <Link
                    href="/financeiro/cadastros/centro-de-custos"
                    onClick={handleLinkClick}
                  >
                    <TableIcon />
                    <span>Centro de Custos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Fornecedores/Clientes"
                  isActive={
                    pathname === "/financeiro/cadastros/fornecedores-clientes"
                  }
                >
                  <Link
                    href="/financeiro/cadastros/fornecedores-clientes"
                    onClick={handleLinkClick}
                  >
                    <TableIcon />
                    <span>Fornecedores/Clientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Contas"
                  isActive={pathname === "/financeiro/cadastros/contas"}
                >
                  <Link
                    href="/financeiro/cadastros/contas"
                    onClick={handleLinkClick}
                  >
                    <TableIcon />
                    <span>Contas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>
      <SidebarFooter>
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
