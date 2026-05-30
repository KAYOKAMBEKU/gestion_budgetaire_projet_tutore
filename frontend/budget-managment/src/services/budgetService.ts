import { apiClient } from "../api/client";
import type { Budget, BudgetCreate } from "../types/budget";

export const budgetService = {
  async getBudgetById(id: number): Promise<Budget> {
    const { data } = await apiClient.get<Budget>(`/budgets/${id}`);
    return data;
  },
  async getBudgetsByDepartement(departementId: number): Promise<Budget[]> {
    const { data } = await apiClient.get<Budget[]>(`/budgets/by-departement/${departementId}`);
    return data;
  },
  async getBudgetsByStatut(statut: string): Promise<Budget[]> {
    const { data } = await apiClient.get<Budget[]>(`/budgets/by-statut/${statut}`);
    return data;
  },
  async getBudgetsByProjet(projetId: number): Promise<Budget[]> {
    const { data } = await apiClient.get<Budget[]>(`/budgets/by-projet/${projetId}`);
    return data;
  },
  async createBudget(payload: BudgetCreate): Promise<Budget> {
    const { data } = await apiClient.post<Budget>("/budgets/", payload);
    return data;
  },
  async submitBudget(id: number): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}/submit`);
    return data;
  },
  async validateByGestionnaire(id: number): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}/validate-gestionnaire`);
    return data;
  },
  async rejectByGestionnaire(id: number): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}/reject-gestionnaire`);
    return data;
  },
  async submitToAdmin(id: number): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}/submit-admin`);
    return data;
  },
  async approveBudget(id: number): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}/approve`);
    return data;
  },
  async rejectBudget(id: number): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}/reject`);
    return data;
  },
  async startExecution(id: number): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}/start-execution`);
    return data;
  },
};
