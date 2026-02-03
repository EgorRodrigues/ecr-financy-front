import { sanitizeApiUrl } from "./utils";

function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!url) {
    throw new Error(
      "API Base URL not found. Please set NEXT_PUBLIC_API_BASE_URL."
    );
  }

  return sanitizeApiUrl(url);
}

// Authentication Service URL
export function getAuthBaseUrl() {
  const url = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || "http://localhost:3333";
  return sanitizeApiUrl(url);
}
const AUTH_API_BASE_URL = getAuthBaseUrl();

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<AuthResponse> | null = null;

export function setAuthSession(token: string | null, refresh: string | null) {
  accessToken = token;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
    if (refresh) {
      localStorage.setItem("refreshToken", refresh);
    } else {
      localStorage.removeItem("refreshToken");
    }
    window.dispatchEvent(new CustomEvent("auth:token-changed", { detail: token }));
  }
}

if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken");
  refreshToken = localStorage.getItem("refreshToken");
}

export function decodeJwt<T>(token: string): T | null {
  console.log("decodeJwt: Iniciando decodificação do token...");
  const parts = token.split(".");
  if (parts.length < 2) {
    console.error("decodeJwt: Token inválido, menos de 2 partes.");
    return null;
  }
  const payload = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
  try {
    const decoded = JSON.parse(atob(payload)) as T;
    console.log("decodeJwt: Decodificação bem-sucedida.", decoded);
    return decoded;
  } catch (e) {
    console.error("decodeJwt: Erro ao fazer parse do payload.", e);
    return null;
  }
}

function decodeJwtExpMs(token: string): number | null {
  const json = decodeJwt<{ exp?: number }>(token);
  if (!json || typeof json.exp !== "number") return null;
  return json.exp * 1000;
}

async function refreshAuthTokenInternal(): Promise<string> {
  if (refreshInFlight) {
    const res = await refreshInFlight;
    return res.token;
  }
  refreshInFlight = (async () => {
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const refreshRes = await fetch(`${AUTH_API_BASE_URL}/token/refresh`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      throw new Error("Session expired");
    }

    const data = await refreshRes.json();
    if (!data?.token || !data?.refreshToken) {
      throw new Error("Session expired");
    }
    setAuthSession(data.token, data.refreshToken);
    return data as AuthResponse;
  })();

  try {
    const res = await refreshInFlight;
    return res.token;
  } finally {
    refreshInFlight = null;
  }
}

export async function refreshAuthToken(): Promise<string> {
  return refreshAuthTokenInternal();
}

export function getAccessTokenExpMs(): number | null {
  if (!accessToken) return null;
  return decodeJwtExpMs(accessToken);
}

async function apiFetch<T>(path: string, init?: RequestInit, customBaseUrl?: string): Promise<T> {
  const baseUrl = customBaseUrl || getBaseUrl();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  if (accessToken) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (headers as any)["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    headers,
    ...init,
  });

  if (res.status === 401 && !path.includes("/login") && !path.includes("/token/refresh")) {
    // Try to refresh token
    try {
      const newToken = await refreshAuthTokenInternal();
      // Retry original request
      const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        const retryRes = await fetch(`${baseUrl}${path}`, {
          headers: newHeaders,
          ...init,
        });

        if (!retryRes.ok) {
           const text = await retryRes.text().catch(() => "");
           throw new Error(`HTTP ${retryRes.status} ${retryRes.statusText} - ${text}`);
        }

        try {
            return (await retryRes.json()) as T;
        } catch {
            return undefined as unknown as T;
        }
    } catch (e) {
      setAuthSession(null, null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
      }
      throw e;
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    // no content
    return undefined as unknown as T;
  }
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  refreshToken?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
};

export async function register(input: RegisterInput) {
  return apiFetch<void>(`/register`, {
    method: "POST",
    body: JSON.stringify(input),
  }, AUTH_API_BASE_URL);
}

export async function login(input: LoginInput) {
  return apiFetch<AuthResponse>(`/login`, {
    method: "POST",
    body: JSON.stringify(input),
    credentials: "include", // To set the cookie
  }, AUTH_API_BASE_URL);
}

export async function logout(refreshToken: string) {
  return apiFetch<void>(`/logout`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  }, AUTH_API_BASE_URL);
}

export async function getMe() {
  return apiFetch<User>(`/me`, { method: "GET" }, AUTH_API_BASE_URL);
}

export type CategoryInput = {
  name: string;
  description?: string;
  active: boolean;
};
export type SubcategoryInput = {
  name: string;
  description?: string;
  active: boolean;
  category_id: string;
};
export type CostCenterInput = {
  code?: string;
  name: string;
  description?: string;
  active: boolean;
};
export type ContactInput = {
  type: "supplier" | "customer";
  person_type: "individual" | "company";
  name: string;
  document?: string;
  email?: string;
  phone_e164?: string;
  phone_local?: string;
  address?: string;
  notes?: string;
  active: boolean;
};

export type Contact = ContactInput & { id: string };

export async function getCategories(): Promise<
  Array<{ id: string; name: string; description?: string; active?: boolean }>
> {
  return apiFetch(`/categories/`, { method: "GET" });
}

export async function createCategory(input: CategoryInput) {
  return apiFetch(`/categories/`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCategory(id: string, input: CategoryInput) {
  return apiFetch(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteCategory(id: string) {
  return apiFetch(`/categories/${id}`, { method: "DELETE" });
}

export async function createSubcategory(input: SubcategoryInput) {
  return apiFetch(`/subcategories/`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSubcategory(
  categoryId: string,
  id: string,
  input: SubcategoryInput
) {
  return apiFetch(`/subcategories/${categoryId}/${id}/`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteSubcategory(categoryId: string, id: string) {
  return apiFetch(`/subcategories/${categoryId}/${id}/`, { method: "DELETE" });
}

export async function getAllSubcategories(): Promise<
  Array<{
    id: string;
    name: string;
    description?: string;
    active?: boolean;
    category_id?: string;
  }>
> {
  return apiFetch(`/subcategories/`, { method: "GET" });
}

export async function createCostCenter(input: CostCenterInput) {
  return apiFetch(`/cost-centers/`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCostCenter(id: string, input: CostCenterInput) {
  return apiFetch(`/cost-centers/${id}/`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteCostCenter(id: string) {
  return apiFetch(`/cost-centers/${id}/`, { method: "DELETE" });
}

export async function getSubcategories(
  categoryId: string
): Promise<Array<{ id: string; name: string }>> {
  const all = await getAllSubcategories();
  return all.filter((s) => s.category_id === categoryId);
}

export async function getCostCenters(): Promise<
  Array<{ id: string; name: string; code?: string }>
> {
  return apiFetch(`/cost-centers/`, { method: "GET" });
}

export async function createContact(input: ContactInput) {
  return apiFetch(`/contacts/`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateContact(id: string, input: ContactInput) {
  return apiFetch(`/contacts/${id}/`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteContact(id: string) {
  return apiFetch(`/contacts/${id}/`, { method: "DELETE" });
}

export async function getContacts(): Promise<Array<Contact>> {
  return apiFetch(`/contacts/`, { method: "GET" });
}

export type AccountInput = {
  name: string;
  type: "bank" | "credit_card" | "wallet";
  agency?: string;
  account?: string;
  card_number?: string;
  initial_balance?: number;
  available_limit?: number;
  closing_day?: number;
  due_day?: number;
  active?: boolean;
};

export type Account = {
  id: string;
  name: string;
  type: "bank" | "credit_card" | "wallet";
  agency?: string | null;
  account?: string | null;
  card_number?: string | null;
  initial_balance?: number | null;
  available_limit?: number | null;
  closing_day?: number | null;
  due_day?: number | null;
  created_at: string;
  updated_at: string;
  active: boolean;
};

export async function createAccount(input: AccountInput) {
  return apiFetch(`/accounts/`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAccounts(params?: {
  limit?: number;
  account?: string;
  account_type?: string;
}): Promise<Array<Account>> {
  const query = new URLSearchParams();
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.account) query.append("account", params.account);
  if (params?.account_type) query.append("account_type", params.account_type);
  return apiFetch(`/accounts/?${query.toString()}`, { method: "GET" });
}

export async function getAccount(id: string): Promise<Account> {
  return apiFetch(`/accounts/${id}`, { method: "GET" });
}

export async function updateAccount(id: string, input: AccountInput) {
  return apiFetch(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteAccount(id: string) {
  return apiFetch(`/accounts/${id}`, { method: "DELETE" });
}

export type TransactionInput = {
  amount: number;
  status: "pendente" | "pago" | "cancelado" | "recebido";
  issue_date?: string;
  due_date?: string;
  payment_date?: string;
  interest?: number;
  fine?: number;
  discount?: number;
  total_paid?: number;
  total_received?: number;
  category_id?: string;
  subcategory_id?: string;
  cost_center_id?: string;
  contact_id?: string;
  description?: string;
  document?: string;
  payment_method?: string;
  account?: string;
  recurrence?: boolean;
  competence?: string;
  project?: string;
  tags?: string[];
  notes?: string;
  active?: boolean;
};

export type ExpenseRecord = TransactionInput & { id: string };
export type IncomeRecord = TransactionInput & { id: string };

export async function createExpense(input: TransactionInput) {
  return apiFetch(`/expenses/`, { method: "POST", body: JSON.stringify(input) });
}

export async function createIncome(input: TransactionInput) {
  return apiFetch(`/incomes/`, { method: "POST", body: JSON.stringify(input) });
}

export async function getExpenses(params?: {
  account?: string;
  account_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Array<ExpenseRecord>> {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return apiFetch(`/expenses/?${query}`, { method: "GET" });
}

export async function getIncomes(params?: {
  account?: string;
  account_type?: string;
  status?: string;
}): Promise<Array<IncomeRecord>> {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return apiFetch(`/incomes/?${query}`, { method: "GET" });
}

export async function updateExpense(id: string, input: TransactionInput) {
  return apiFetch(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteExpense(id: string) {
  return apiFetch(`/expenses/${id}`, { method: "DELETE" });
}

export async function updateIncome(id: string, input: TransactionInput) {
  return apiFetch(`/incomes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteIncome(id: string) {
  return apiFetch(`/incomes/${id}`, { method: "DELETE" });
}

export type CreditCardTransactionInput = {
  amount: number;
  status: "pendente" | "pago" | "cancelado";
  issue_date?: string;
  due_date?: string;
  payment_date?: string;
  original_amount?: number;
  interest?: number;
  fine?: number;
  discount?: number;
  total_paid?: number;
  category_id?: string;
  subcategory_id?: string;
  cost_center_id?: string;
  contact_id?: string;
  description?: string;
  document?: string;
  payment_method?: string;
  account?: string;
  recurrence?: boolean;
  competence?: string;
  project?: string;
  tags?: string[];
  notes?: string;
  active?: boolean;
  invoice_id?: string;
};

export type CreditCardTransactionRecord = CreditCardTransactionInput & {
  id: string;
};

export async function createCreditCardTransaction(
  input: CreditCardTransactionInput
) {
  return apiFetch(`/credit-card-transactions/`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCreditCardTransactions(params?: {
  account?: string;
}): Promise<Array<CreditCardTransactionRecord>> {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return apiFetch(`/credit-card-transactions/?${query}`, { method: "GET" });
}

export async function getCreditCardTransaction(
  id: string
): Promise<CreditCardTransactionRecord> {
  return apiFetch(`/credit-card-transactions/${id}`, { method: "GET" });
}

export async function updateCreditCardTransaction(
  id: string,
  input: CreditCardTransactionInput
) {
  return apiFetch(`/credit-card-transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteCreditCardTransaction(id: string) {
  return apiFetch(`/credit-card-transactions/${id}`, { method: "DELETE" });
}

export type Invoice = {
  id: string;
  account_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  amount: number;
  status: string;
  payment_date: string | null;
  interest: number | null;
  fine: number | null;
  discount: number | null;
  total_paid: number | null;
  expense_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditCardInvoiceInput = {
  account_id?: string;
  period_start?: string;
  period_end?: string;
  due_date?: string;
  amount?: number;
  status?: string;
  payment_date?: string | null;
  interest?: number | null;
  fine?: number | null;
  discount?: number | null;
  total_paid?: number | null;
  expense_id?: string | null;
};

export async function getCreditCardInvoices(params?: {
  account_id?: string;
  status?: string;
}): Promise<Invoice[]> {
  const query = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  return apiFetch(`/credit-card-invoices/${query}`, { method: "GET" });
}

export async function getCreditCardInvoice(id: string): Promise<Invoice> {
  return apiFetch(`/credit-card-invoices/${id}`, { method: "GET" });
}

export async function updateCreditCardInvoice(
  id: string,
  input: CreditCardInvoiceInput
) {
  return apiFetch(`/credit-card-invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export type CreditCardSummaryResponse = {
  total_limit: number;
  available_limit: number;
  transactions: CreditCardTransactionRecord[];
  current_invoice?: Invoice;
  next_invoices: Invoice[];
};

export async function getCreditCardSummary(
  accountId: string
): Promise<CreditCardSummaryResponse> {
  return apiFetch(`/credit-card-transactions/summary/${accountId}`, {
    method: "GET",
  });
}

export type ForecastItem = {
  id: string;
  month: string; // YYYY-MM
  category: string;
  amount: number;
  status: "projetado" | "confirmado";
  type: "income" | "expense";
};

export async function getFinancialForecast(
  startDate: string,
  endDate: string
): Promise<Array<ForecastItem>> {
  return apiFetch(
    `/financial-forecast/?startDate=${startDate}&endDate=${endDate}`,
    { method: "GET" }
  );
}

export type BankStatementTransaction = {
  id: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  payment_date?: string | null;
  receipt_date?: string | null;
  original_amount: number;
  interest: number;
  fine: number;
  discount: number;
  total_paid?: number;
  total_received?: number;
  category_id: string;
  subcategory_id: string;
  cost_center_id: string;
  contact_id: string;
  description: string;
  document: string | null;
  payment_method: string | null;
  receiving_method?: string | null;
  account: string;
  recurrence: boolean;
  competence: string | null;
  project: string | null;
  tags: string[];
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: "expense" | "income";
  category_name: string;
};

export type BankStatementResponse = {
  account_balance: number;
  period_summary: {
    total_income: number;
    total_expense: number;
    net_result: number;
  };
  transactions: BankStatementTransaction[];
};

export async function getBankStatement(params?: {
  startDate?: string;
  endDate?: string;
  accounts?: string[];
}): Promise<BankStatementResponse> {
  const query = new URLSearchParams();
  if (params?.startDate) query.append("start_date", params.startDate);
  if (params?.endDate) query.append("end_date", params.endDate);
  if (params?.accounts) {
    params.accounts.forEach((id) => query.append("accounts", id));
  }

  return apiFetch(`/bank-statement/?${query.toString()}`, { method: "GET" });
}

export type DashboardResponse = {
  accounts: {
    id: string;
    name: string;
    balance: number;
    bank: string;
  }[];
  monthlySummary: {
    month: string;
    income: number;
    expense: number;
  }[];
  recentTransactions: {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: "income" | "expense";
  }[];
};

export async function getDashboard(): Promise<DashboardResponse> {
  return apiFetch("/dashboard", { method: "GET" });
}
