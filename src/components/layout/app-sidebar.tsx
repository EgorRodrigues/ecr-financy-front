"use client";

import {
  Home,
  LineChart,
  Table as TableIcon,
  ReceiptText,
  HandCoins,
  Banknote,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/layout/nav-user";
import { SearchForm } from "@/components/layout/search-form";

const data = {
  user: {
    name: "Usuario",
    email: "usuario@exemplo.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

export function AppSidebar() {
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
                <SidebarMenuButton asChild tooltip="Financeiro" isActive>
                  <Link href="/financeiro">
                    <Home />
                    <span>Financeiro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cartão de Crédito">
                  <Link href="/financeiro/cartao-credito">
                    <CreditCard />
                    <span>Cartão de Crédito</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Contas a Pagar">
                  <Link href="/financeiro/contas-a-pagar">
                    <Banknote />
                    <span>Contas a Pagar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Contas a Receber">
                  <Link href="/financeiro/contas-a-receber">
                    <HandCoins />
                    <span>Contas a Receber</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Relatórios de Despesas">
                  <Link href="/financeiro/relatorios/despesas">
                    <LineChart />
                    <span>Relatórios Despesas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Previsão Financeira">
                  <Link href="/financeiro/relatorios/previsao">
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
                <SidebarMenuButton asChild tooltip="Categoria">
                  <Link href="/financeiro/cadastros/categoria">
                    <TableIcon />
                    <span>Categoria</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Subcategoria">
                  <Link href="/financeiro/cadastros/subcategoria">
                    <TableIcon />
                    <span>Subcategoria</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Centro de Custos">
                  <Link href="/financeiro/cadastros/centro-de-custos">
                    <TableIcon />
                    <span>Centro de Custos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Fornecedores/Clientes">
                  <Link href="/financeiro/cadastros/fornecedores-clientes">
                    <TableIcon />
                    <span>Fornecedores/Clientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Contas">
                  <Link href="/financeiro/cadastros/contas">
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
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
