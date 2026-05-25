import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetService } from "../../../services/budgetService";
import { categorieBudgetaireService } from "../../../services/categorieBudgetaireService";
import { departementService } from "../../../services/departementService";
import { exerciceBudgetaireService } from "../../../services/exerciceBudgetaireService";
import { ligneBudgetaireService } from "../../../services/ligneBudgetaireService";
import type { Budget, BudgetCreate } from "../../../types/budget";
import type { TypeCategorieBudgetaire } from "../../../types/categorieBudgetaire";
import type { DraftBudgetLine, LigneBudgetaireCreate } from "../../../types/ligneBudgetaire";

export interface CreateBudgetWithLinesPayload extends BudgetCreate {
  lignes: DraftBudgetLine[];
}

export function useActiveExercice() {
  return useQuery({
    queryKey: ["exercice-actif"],
    queryFn: exerciceBudgetaireService.getActiveExerciceBudgetaire,
    retry: false,
  });
}

export function useManagerDepartement(departementId?: number) {
  return useQuery({
    queryKey: ["departements", departementId],
    queryFn: () => departementService.getDepartementById(departementId ?? 0),
    enabled: Boolean(departementId),
  });
}

export function useCategoriesBudgetaires() {
  return useQuery({
    queryKey: ["categories-budgetaires"],
    queryFn: categorieBudgetaireService.getCategoriesBudgetaires,
  });
}

export function useCategoriesByType(type: TypeCategorieBudgetaire) {
  return useQuery({
    queryKey: ["categories-budgetaires", type],
    queryFn: () => categorieBudgetaireService.getCategoriesByType(type),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetCreate) => budgetService.createBudget(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useManagerBudgets(departementId?: number) {
  return useQuery({
    queryKey: ["budgets", "departement", departementId],
    queryFn: () => budgetService.getBudgetsByDepartement(departementId ?? 0),
    enabled: Boolean(departementId),
  });
}

export function useBudgetsByProjects(projectIds: number[]) {
  return useQuery({
    queryKey: ["budgets", "projets", projectIds],
    queryFn: async () => {
      const budgetsByProject = await Promise.all(projectIds.map((projectId) => budgetService.getBudgetsByProjet(projectId)));
      return budgetsByProject.flat();
    },
    enabled: projectIds.length > 0,
  });
}

export function useSubmitBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetService.submitBudget(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useCreateBudgetWithLines() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBudgetWithLinesPayload): Promise<Budget> => {
      const { lignes, ...budgetPayload } = payload;
      const budget = await budgetService.createBudget(budgetPayload);

      for (const line of lignes) {
        const linePayload: LigneBudgetaireCreate = {
          libelle: line.libelle,
          description: line.description,
          montant_prevu: line.montant_prevu,
          type_ligne: line.type_ligne,
          categorie_id: line.categorie_id,
          budget_id: budget.id,
        };
        await ligneBudgetaireService.createLigneBudgetaire(linePayload);
      }

      return budgetService.submitBudget(budget.id);
    },
    onSuccess: (budget) => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", "departement"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", budget.id] });
      void queryClient.invalidateQueries({ queryKey: ["lignes-budgetaires", budget.id] });
    },
  });
}
