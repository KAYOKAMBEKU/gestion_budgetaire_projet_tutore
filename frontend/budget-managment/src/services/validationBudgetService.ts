import { apiClient } from "../api/client";
import type { ValidationBudget, ValidationBudgetCreate } from "../types/validationBudget";

export const validationBudgetService = {
  async createValidation(payload: ValidationBudgetCreate): Promise<ValidationBudget> {
    const { data } = await apiClient.post<ValidationBudget>("/validations-budgetaires/", payload);
    return data;
  },

  async getValidationsByBudget(budgetId: number): Promise<ValidationBudget[]> {
    const { data } = await apiClient.get<ValidationBudget[]>(`/validations-budgetaires/by-budget/${budgetId}`);
    return data;
  },
};
