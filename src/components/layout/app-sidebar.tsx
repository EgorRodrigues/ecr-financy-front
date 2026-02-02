"use client";

import {
  LineChart,
  ReceiptText,
  HandCoins,
  Banknote,
  CreditCard,
  Landmark,
  ChevronRight,
  Database,
  LayoutDashboard,
  CheckCircle2,
  CheckCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/layout/nav-user";
import { useAuth } from "@/contexts/AuthContext";

// Definição dos menus
const data = {
  navMain: [
    {
      title: "Financeiro",
      url: "#",
      icon: Wallet,
      items: [
        { title: "Contas a Pagar", url: "/contas-a-pagar", icon: Banknote },
        { title: "Contas a Receber", url: "/contas-a-receber", icon: HandCoins },
        { title: "Contas Pagas", url: "/contas-pagas", icon: CheckCircle2 },
        { title: "Contas Recebidas", url: "/contas-recebidas", icon: CheckCircle },
        { title: "Extrato por Conta", url: "/extrato-conta", icon: Landmark },
        { title: "Cartão de Crédito", url: "/cartao-credito", icon: CreditCard },
      ],
    },
    {
      title: "Cadastros",
      url: "#",
      icon: Database,
      items: [
        { title: "Categorias", url: "/cadastros/categoria" },
        { title: "Subcategorias", url: "/cadastros/subcategoria" },
        { title: "Centros de Custo", url: "/cadastros/centro-de-custos" },
        { title: "Fornecedores/Clientes", url: "/cadastros/fornecedores-clientes" },
        { title: "Contas Bancárias", url: "/cadastros/contas" },
      ],
    },
    {
      title: "Relatórios",
      url: "#",
      icon: LineChart,
      items: [
        { title: "Previsão Financeira", url: "/relatorios/previsao" },
      ],
    },
  ],
};

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Estado para controlar quais menus estão abertos
  const [openMenus, setOpenMenus] = useState<string[]>(["Financeiro"]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center h-14">
           <Link href="/" className="flex items-center gap-2 px-2" onClick={handleLinkClick}>
             <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
               <ReceiptText className="size-4" />
             </div>
             <span className="truncate font-semibold text-lg group-data-[collapsible=icon]:hidden">
               Financy
             </span>
           </Link>
           <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
             {/* Dashboard Item */}
             <SidebarMenuItem>
               <SidebarMenuButton 
                 asChild 
                 isActive={pathname === "/"} 
                 tooltip="Dashboard"
               >
                 <Link href="/" onClick={handleLinkClick}>
                   <LayoutDashboard />
                   <span>Dashboard</span>
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>

             {/* Grupos Expansíveis */}
             {data.navMain.map((item) => {
                const isOpen = openMenus.includes(item.title);
                // Verifica se algum subitem está ativo para marcar o grupo
                const isActiveGroup = item.items.some(sub => sub.url === pathname);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => toggleMenu(item.title)}
                      tooltip={item.title}
                      isActive={isActiveGroup}
                      className="cursor-pointer font-medium"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight
                        className={`ml-auto transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                    
                    {isOpen && (
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton 
                              asChild 
                              isActive={pathname === subItem.url}
                              size="md"
                            >
                              <Link href={subItem.url} onClick={handleLinkClick}>
                                {/* @ts-ignore - Verifica se icon existe no subItem */}
                                {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 opacity-70" />}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
             })}
          </SidebarMenu>
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
