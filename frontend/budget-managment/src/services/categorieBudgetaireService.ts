import { apiClient } from "../api/client";
import type { CategorieBudgetaire, TypeCategorieBudgetaire } from "../types/categorieBudgetaire";

export const categorieBudgetaireService = {
  async getCategoriesBudgetaires(): Promise<CategorieBudgetaire[]> {
    const { data } = await apiClient.get<CategorieBudgetaire[]>("/categories-budgetaires/");
    return data;
  },
  async getCategoriesByType(type: TypeCategorieBudgetaire): Promise<CategorieBudgetaire[]> {
    const { data } = await apiClient.get<CategorieBudgetaire[]>(`/categories-budgetaires/by-type/${type}`);
    return data;
  },
};
