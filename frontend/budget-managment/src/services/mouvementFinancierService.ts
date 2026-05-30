import { apiClient } from "../api/client";
import type { ExecutionBudgetaire, MouvementFinancier, MouvementFinancierCreate, TypeMouvementFinancier } from "../types/mouvementFinancier";

export const mouvementFinancierService = {
  async getMouvements(params?: {
    budget_id?: number;
    projet_id?: number;
    type_mouvement?: TypeMouvementFinancier;
    date_debut?: string;
    date_fin?: string;
  }): Promise<MouvementFinancier[]> {
    const { data } = await apiClient.get<MouvementFinancier[]>("/mouvements-financiers/", { params });
    return data;
  },

  async createMouvement(payload: MouvementFinancierCreate): Promise<MouvementFinancier> {
    const { data } = await apiClient.post<MouvementFinancier>("/mouvements-financiers/", payload);
    return data;
  },

  async getBudgetExecution(budgetId: number): Promise<ExecutionBudgetaire> {
    const { data } = await apiClient.get<ExecutionBudgetaire>(`/budgets/${budgetId}/execution`);
    return data;
  },

  async getBudgetAnalyseEcarts(budgetId: number): Promise<ExecutionBudgetaire> {
    const { data } = await apiClient.get<ExecutionBudgetaire>(`/budgets/${budgetId}/analyse-ecarts`);
    return data;
  },
};
