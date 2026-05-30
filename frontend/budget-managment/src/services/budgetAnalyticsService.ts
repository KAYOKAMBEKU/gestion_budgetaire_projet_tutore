import { budgetService } from "./budgetService";
import { mouvementFinancierService } from "./mouvementFinancierService";
import type { Budget, BudgetStatus } from "../types/budget";
import type { ExecutionBudgetaire } from "../types/mouvementFinancier";

export const trackedBudgetStatuses: BudgetStatus[] = [
  "brouillon",
  "soumis",
  "soumis_gestionnaire",
  "valide",
  "valide_gestionnaire",
  "soumis_admin",
  "approuve_admin",
  "rejete",
  "rejete_gestionnaire",
  "rejete_admin",
  "en_execution",
  "execute",
  "cloture",
];

export function uniqueBudgets(budgets: Budget[]) {
  return Array.from(new Map(budgets.map((budget) => [budget.id, budget])).values());
}

export const budgetAnalyticsService = {
  async getBudgetsByStatuses(statuses: BudgetStatus[] = trackedBudgetStatuses): Promise<Budget[]> {
    const budgets = await Promise.all(statuses.map((status) => budgetService.getBudgetsByStatut(status)));
    return uniqueBudgets(budgets.flat());
  },

  async getExecutionByBudgetIds(budgetIds: number[]): Promise<Record<number, ExecutionBudgetaire>> {
    const entries = await Promise.all(
      budgetIds.map(async (budgetId) => {
        const execution = await mouvementFinancierService.getBudgetExecution(budgetId);
        return [budgetId, execution] as const;
      }),
    );
    return Object.fromEntries(entries);
  },
};

