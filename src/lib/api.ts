declare global {
  interface Window {
    __ENV?: {
      NEXT_PUBLIC_API_BASE_URL?: string;
    };
  }
}

import { sanitizeApiUrl } from "./utils";

function getBaseUrl() {
  let url: string | undefined;

  if (typeof window !== "undefined" && window.__ENV?.NEXT_PUBLIC_API_BASE_URL) {
    url = window.__ENV.NEXT_PUBLIC_API_BASE_URL;
  } else if (
    typeof window === "undefined" &&
    process.env["NEXT_PUBLIC_API_BASE_URL"]
  ) {
    url = process.env["NEXT_PUBLIC_API_BASE_URL"];
  } else if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    url = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (!url) {
    throw new Error(
      "API Base URL not found. Please set NEXT_PUBLIC_API_BASE_URL."
    );
  }

  return sanitizeApiUrl(url);
}

// Authentication Service URL
const AUTH_API_BASE_URL = "http://localhost:3333";

let accessToken: string | null = null;

export function setAuthToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }
}

if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken");
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
      // Refresh token endpoint is likely on the Auth Service
      const refreshRes = await fetch(`${AUTH_API_BASE_URL}/token/refresh`, {
        method: "PATCH",
        credentials: "include",
      });
      
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAuthToken(data.token);
        
        // Retry original request
        const newHeaders = { ...headers, Authorization: `Bearer ${data.token}` };
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
      } else {
        // Refresh failed, logout
        setAuthToken(null);
        if (typeof window !== "undefined") {
             window.location.href = "/login";
        }
        throw new Error("Session expired");
      }
    } catch (e) {
      setAuthToken(null);
      if (typeof window !== "undefined") {
           window.location.href = "/login";
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
  created_at: string;
  updated_at: string;
};

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

export type DashboardResponse = {
  big_numbers: {
    balance: number;
    approved: number;
    pending: number;
    failed: number;
  };
  monthly: Array<{
    month: string;
    inflows: number;
    outflows: number;
  }>;
  recent_transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    status: "pending" | "paid" | "received" | "canceled";
    type: "income" | "expense";
  }>;
};

export async function getDashboard(
  months?: number,
  recent_limit?: number
): Promise<DashboardResponse> {
  const params: string[] = [];
  if (typeof months === "number") params.push(`months=${months}`);
  if (typeof recent_limit === "number")
    params.push(`recent_limit=${recent_limit}`);
  const q = params.length ? `?${params.join("&")}` : "";
  return apiFetch(`/dashboard/${q}`, { method: "GET" });
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
