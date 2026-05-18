import { apiClient } from "../api/client";
import type { LigneBudgetaire, LigneBudgetaireCreate } from "../types/ligneBudgetaire";

export const ligneBudgetaireService = {
  async createLigneBudgetaire(payload: LigneBudgetaireCreate): Promise<LigneBudgetaire> {
    const { data } = await apiClient.post<LigneBudgetaire>("/lignes-budgetaires/", payload);
    return data;
  },
  async getLignesByBudget(budgetId: number): Promise<LigneBudgetaire[]> {
    const { data } = await apiClient.get<LigneBudgetaire[]>(`/lignes-budgetaires/by-budget/${budgetId}`);
    return data;
  },
};
