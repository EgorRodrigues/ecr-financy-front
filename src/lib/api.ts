const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`)
  }
  try {
    return (await res.json()) as T
  } catch {
    // no content
    return undefined as unknown as T
  }
}

export type CategoryInput = { name: string; description?: string; active: boolean }
export type SubcategoryInput = { name: string; description?: string; active: boolean; category_id: string }
export type CostCenterInput = { code?: string; name: string; description?: string; active: boolean }
export type ContactInput = {
  type: "supplier" | "customer"
  person_type: "individual" | "company"
  name: string
  document?: string
  email?: string
  phone_e164?: string
  phone_local?: string
  address?: string
  notes?: string
  active: boolean
}

export type Contact = ContactInput & { id: string }

export async function getCategories(): Promise<Array<{ id: string; name: string; description?: string; active?: boolean }>> {
  return apiFetch(`/categories/`, { method: "GET" })
}

export async function createCategory(input: CategoryInput) {
  return apiFetch(`/categories/`, { method: "POST", body: JSON.stringify(input) })
}

export async function createSubcategory(input: SubcategoryInput) {
  return apiFetch(`/subcategories/`, { method: "POST", body: JSON.stringify(input) })
}

export async function getAllSubcategories(): Promise<Array<{ id: string; name: string; description?: string; active?: boolean; category_id?: string }>> {
  return apiFetch(`/subcategories/`, { method: "GET" })
}

export async function createCostCenter(input: CostCenterInput) {
  return apiFetch(`/cost-centers/`, { method: "POST", body: JSON.stringify(input) })
}

export async function getSubcategories(categoryId: string): Promise<Array<{ id: string; name: string }>> {
  return apiFetch(`/subcategories/${categoryId}/`, { method: "GET" })
}

export async function getCostCenters(): Promise<Array<{ id: string; name: string; code?: string }>> {
  return apiFetch(`/cost-centers/`, { method: "GET" })
}

export async function createContact(input: ContactInput) {
  return apiFetch(`/contacts`, { method: "POST", body: JSON.stringify(input) })
}

export async function getContacts(): Promise<Array<Contact>> {
  return apiFetch(`/contacts`, { method: "GET" })
}

export type TransactionInput = {
  amount: number
  status: "pendente" | "pago" | "cancelado" | "recebido"
  issue_date?: string
  due_date?: string
  payment_date?: string
  category_id?: string
  subcategory_id?: string
  cost_center_id?: string
  contact_id?: string
  description?: string
  document?: string
  payment_method?: string
  account?: string
  recurrence?: boolean
  competence?: string
  project?: string
  tags?: string[]
  notes?: string
  active?: boolean
}

export type ExpenseRecord = TransactionInput & { id: string }
export type IncomeRecord = TransactionInput & { id: string }

export async function createExpense(input: TransactionInput) {
  return apiFetch(`/expenses/`, { method: "POST", body: JSON.stringify(input) })
}

export async function createIncome(input: TransactionInput) {
  return apiFetch(`/incomes/`, { method: "POST", body: JSON.stringify(input) })
}

export async function getExpenses(): Promise<Array<ExpenseRecord>> {
  return apiFetch(`/expenses/`, { method: "GET" })
}

export async function getIncomes(): Promise<Array<IncomeRecord>> {
  return apiFetch(`/incomes/`, { method: "GET" })
}

export async function updateExpense(id: string, input: TransactionInput) {
  return apiFetch(`/expenses/${id}/`, { method: "PUT", body: JSON.stringify(input) })
}

export async function deleteExpense(id: string) {
  return apiFetch(`/expenses/${id}/`, { method: "DELETE" })
}

export async function updateIncome(id: string, input: TransactionInput) {
  return apiFetch(`/incomes/${id}/`, { method: "PUT", body: JSON.stringify(input) })
}

export async function deleteIncome(id: string) {
  return apiFetch(`/incomes/${id}/`, { method: "DELETE" })
}
