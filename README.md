# Financy (Frontend)

Financy é uma aplicação de gestão financeira desenvolvida para simplificar o controle de contas a pagar, receber, extratos bancários e despesas de cartão de crédito. Este repositório contém o código-fonte do frontend, construído com tecnologias modernas do ecossistema React/Next.js.

## 🚀 Tecnologias e Stack

O projeto utiliza uma stack moderna focada em performance, manutenibilidade e experiência do desenvolvedor:

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **UI Lib:** [React 19](https://react.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first config)
- **Componentes:** [Shadcn/UI](https://ui.shadcn.com/) (baseado em Radix UI)
- **Gerenciamento de Estado/Formulários:** React Hook Form + Zod
- **Visualização de Dados:** Recharts
- **Ícones:** Lucide React

## 🛠️ Funcionalidades Principais

- **Dashboard:** Visão geral da saúde financeira.
- **Contas a Pagar e Receber:** Gestão completa de lançamentos com status e datas.
- **Extrato Bancário:** Visualização consolidada de transações com filtros por período e conta.
- **Cartão de Crédito:** Controle de faturas e despesas.
- **Cadastros:** Gestão de categorias, centros de custo, fornecedores e clientes.
- **Relatórios:** Análises detalhadas de despesas e receitas.

## 📦 Instalação e Execução

Siga os passos abaixo para rodar o projeto localmente:

### Pré-requisitos

- Node.js 18+ ou superior
- Gerenciador de pacotes (npm, yarn, pnpm ou bun)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/ecr-financy-front.git
   cd ecr-financy-front
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto (ou `.env.local`) e defina as URLs da API:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   NEXT_PUBLIC_AUTH_API_BASE_URL=http://localhost:3333
   ```
   > **Nota:** Ajuste as URLs conforme o endereço do seu backend.

4. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🎨 Guia de Estilo e Design

Para garantir a consistência visual e técnica do projeto, consulte o nosso guia de design:
👉 [DESIGN_GUIDE.md](DESIGN_GUIDE.md)

Este documento contém detalhes sobre:
- Paleta de cores (Oklch)
- Tipografia (Geist Sans/Mono)
- Padrões de componentes (Sheets, Tables, Cards)

## 📂 Estrutura do Projeto

```
src/
├── app/                 # Rotas e layouts (Next.js App Router)
│   ├── (app)/           # Rotas autenticadas da aplicação
│   ├── auth/            # Rotas de autenticação (callback, etc)
│   ├── login/           # Página de login
│   └── globals.css      # Estilos globais e configuração Tailwind v4
├── components/          # Componentes React
│   ├── app/             # Componentes de negócio (Sheets, Forms)
│   ├── layout/          # Componentes estruturais (Sidebar, Header)
│   └── ui/              # Componentes base (Shadcn/UI)
├── contexts/            # Contextos React (AuthContext, etc)
├── hooks/               # Custom Hooks
└── lib/                 # Utilitários e configuração de API
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
