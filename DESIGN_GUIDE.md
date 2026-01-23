# Documentação de Estilo e Stack Tecnológica

Este documento descreve a stack, o design system e os padrões de interface utilizados no projeto **Financy**. O objetivo é garantir que novas funcionalidades mantenham a consistência visual e técnica com o sistema existente.

## 1. Visão Geral da Stack
*   **Framework:** Next.js 16 (App Router)
*   **Linguagem:** TypeScript
*   **Biblioteca UI:** React 19
*   **Estilização:** Tailwind CSS v4 (Configuração CSS-first via `globals.css`)
*   **Design System Base:** Shadcn/UI (baseado em Radix UI Primitives)
*   **Ícones:** Lucide React
*   **Fontes:** Geist Sans (Interface) e Geist Mono (Código/Dados)
*   **Formulários:** React Hook Form + Zod (Validação)
*   **Gráficos:** Recharts

## 2. Identidade Visual e Temas
O sistema utiliza um design **minimalista e limpo**, focado na usabilidade de dados financeiros.

### Paleta de Cores (Semântica)
O sistema utiliza variáveis CSS baseadas no espaço de cor **Oklch** para maior fidelidade e suporte a temas (Light/Dark). As definições principais encontram-se em `src/app/globals.css`.

*   **Primary:** Ação principal (Botões sólidos, destaques).
*   **Secondary/Muted:** Fundos de apoio, itens desabilitados ou de menor hierarquia.
*   **Destructive:** Ações perigosas (Excluir, Cancelar) e alertas de erro.
*   **Surface/Card:** Fundo branco (light) ou cinza escuro (dark) para conteineres.
*   **Borders:** Cinza sutil para separação de áreas.

### Tipografia
*   **Principal:** `Geist Sans` - Usada em todo o texto de interface, títulos e botões.
*   **Numérica/Técnica:** `Geist Mono` - Ideal para exibição de valores financeiros alinhados ou códigos.

## 3. Padrões de Interface (UI Patterns)

### A. Estrutura de Layout
*   **Sidebar (Barra Lateral):** Navegação principal fixa à esquerda contendo links para os módulos (Contas a Pagar, Extrato, Cadastros).
*   **Área de Conteúdo:** Espaço principal à direita onde as páginas são renderizadas.

### B. Componentes Chave
1.  **Sheets (Gavetas Laterais):**
    *   **Uso:** O padrão principal para **formulários de criação e edição** (ex: "Nova Conta a Pagar", "Editar Cliente").
    *   **Comportamento:** Desliza da direita para a esquerda, sobrepondo o conteúdo sem sair da página.
2.  **Data Tables (Tabelas de Dados):**
    *   **Estilo:** Limpo, com linhas zebradas ou divisores sutis.
    *   **Funcionalidades:** Cabeçalhos ordenáveis, paginação e ações (editar/excluir) na última coluna.
3.  **Cards (Cartões):**
    *   Usados para agrupar métricas (ex: "Total a Pagar", "Saldo Atual") e formulários menores.
4.  **Dialogs (Modais):**
    *   Usados para confirmações críticas (ex: "Tem certeza que deseja excluir?") ou seleções rápidas.

## 4. Guia para o Designer (Novas Features)
Ao criar novas telas, siga estas diretrizes:

*   **Priorize "Sheets" sobre Modais:** Para formulários complexos, prefira usar o painel lateral (Sheet) em vez de modais centralizados.
*   **Consistência de Formulários:** Use labels claros acima dos inputs. Inputs de valor monetário devem ter formatação específica.
*   **Espaçamento:** Utilize a escala de espaçamento do Tailwind (p-4, gap-4, m-6) para manter o ritmo vertical e horizontal consistente.
*   **Feedback Visual:** Indique estados de *loading* (Skeleton loaders) e sucesso/erro (Toasts) para todas as ações do usuário.
*   **Responsividade:** O layout deve se adaptar, colapsando a Sidebar em telas menores (mobile).

---
**Nota Técnica:** O código fonte dos componentes base está em `src/components/ui/`. A configuração do Tailwind v4 está centralizada em `src/app/globals.css` (CSS-first configuration).
