import { apiClient } from "../api/client";
import type { ApiMessage } from "../types/api";
import type { ExerciceBudgetaire, ExerciceBudgetaireCreate, ExerciceBudgetaireUpdate } from "../types/exerciceBudgetaire";

export const exerciceBudgetaireService = {
  async getAll(): Promise<ExerciceBudgetaire[]> {
    const { data } = await apiClient.get<ExerciceBudgetaire[]>("/exercices-budgetaires/");
    return data;
  },
  async getActive(): Promise<ExerciceBudgetaire> {
    const { data } = await apiClient.get<ExerciceBudgetaire>("/exercices-budgetaires/active");
    return data;
  },
  async getActiveExerciceBudgetaire(): Promise<ExerciceBudgetaire> {
    try {
      return await exerciceBudgetaireService.getActive();
    } catch {
      const exercices = await exerciceBudgetaireService.getAll();
      const openedExercice = exercices.find((exercice) => exercice.statut === "ouvert");
      if (!openedExercice) {
        throw new Error("Aucun exercice budgetaire ouvert.");
      }
      return openedExercice;
    }
  },
  async create(payload: ExerciceBudgetaireCreate): Promise<ExerciceBudgetaire> {
    const { data } = await apiClient.post<ExerciceBudgetaire>("/exercices-budgetaires/", payload);
    return data;
  },
  async update(id: number, payload: ExerciceBudgetaireUpdate): Promise<ExerciceBudgetaire> {
    const { data } = await apiClient.put<ExerciceBudgetaire>(`/exercices-budgetaires/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<ApiMessage> {
    const { data } = await apiClient.delete<ApiMessage>(`/exercices-budgetaires/${id}`);
    return data;
  },
  async open(id: number): Promise<ExerciceBudgetaire> {
    const { data } = await apiClient.patch<ExerciceBudgetaire>(`/exercices-budgetaires/${id}/open`);
    return data;
  },
  async close(id: number): Promise<ExerciceBudgetaire> {
    const { data } = await apiClient.patch<ExerciceBudgetaire>(`/exercices-budgetaires/${id}/close`);
    return data;
  },
};
