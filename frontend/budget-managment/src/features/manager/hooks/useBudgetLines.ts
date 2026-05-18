import { useQuery } from "@tanstack/react-query";
import { ligneBudgetaireService } from "../../../services/ligneBudgetaireService";

export function useBudgetLines(budgetId?: number) {
  return useQuery({
    queryKey: ["lignes-budgetaires", budgetId],
    queryFn: () => ligneBudgetaireService.getLignesByBudget(budgetId ?? 0),
    enabled: Boolean(budgetId),
  });
}
