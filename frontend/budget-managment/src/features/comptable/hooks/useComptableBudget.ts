import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetService } from "../../../services/budgetService";
import { ligneBudgetaireService } from "../../../services/ligneBudgetaireService";
import { mouvementFinancierService } from "../../../services/mouvementFinancierService";
import type { MouvementFinancierCreate } from "../../../types/mouvementFinancier";

export function useExecutableBudgets() {
  return useQuery({
    queryKey: ["comptable", "budgets-executables"],
    queryFn: async () => {
      const statuses = ["approuve_admin", "en_execution"];
      const budgets = await Promise.all(statuses.map((status) => budgetService.getBudgetsByStatut(status)));
      return budgets.flat();
    },
  });
}

export function useBudgetExecutionContext(budgetId?: number) {
  return useQuery({
    queryKey: ["comptable", "budget-execution", budgetId],
    enabled: Boolean(budgetId),
    queryFn: async () => {
      const [budget, lignes, execution] = await Promise.all([
        budgetService.getBudgetById(budgetId ?? 0),
        ligneBudgetaireService.getLignesByBudget(budgetId ?? 0),
        mouvementFinancierService.getBudgetExecution(budgetId ?? 0),
      ]);
      return { budget, lignes, execution };
    },
  });
}

export function useCreateMouvementFinancier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MouvementFinancierCreate) => mouvementFinancierService.createMouvement(payload),
    onSuccess: (mouvement) => {
      void queryClient.invalidateQueries({ queryKey: ["comptable", "budget-execution", mouvement.budget_id] });
      void queryClient.invalidateQueries({ queryKey: ["comptable", "budgets-executables"] });
      void queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
    },
  });
}
