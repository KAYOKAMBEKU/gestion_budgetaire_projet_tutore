import type { CurrencyCode } from "../../../context/CurrencyContext";
import type { Budget } from "../../../types/budget";
import type { ExecutionBudgetaire } from "../../../types/mouvementFinancier";
import { formatAmount } from "./formatAmount";

export const currencies: CurrencyCode[] = ["FC", "USD"];
export const overspendRiskThreshold = 90;

export interface CurrencyTotals {
  currency: CurrencyCode;
  count: number;
  prevu: number;
  realise: number;
  recettesPrevues: number;
  recettesRealisees: number;
  depensesPrevues: number;
  depensesRealisees: number;
}

export interface BudgetRiskAlert {
  budgetId?: number | null;
  label: string;
  currency: CurrencyCode;
  prevu: number;
  realise: number;
  taux: number;
  level: "warning" | "danger";
}

export function getBudgetCurrency(budget?: Pick<Budget, "devise"> | null): CurrencyCode {
  return budget?.devise === "USD" ? "USD" : "FC";
}

export function getExecutionCurrency(execution?: Pick<ExecutionBudgetaire, "devise"> | null): CurrencyCode {
  return execution?.devise === "USD" ? "USD" : "FC";
}

export function emptyCurrencyTotals(currency: CurrencyCode): CurrencyTotals {
  return {
    count: 0,
    currency,
    depensesPrevues: 0,
    depensesRealisees: 0,
    prevu: 0,
    realise: 0,
    recettesPrevues: 0,
    recettesRealisees: 0,
  };
}

export function groupBudgetTotalsByCurrency(budgets: Budget[]) {
  const totals = new Map<CurrencyCode, CurrencyTotals>(currencies.map((currency) => [currency, emptyCurrencyTotals(currency)]));

  for (const budget of budgets) {
    const currency = getBudgetCurrency(budget);
    const current = totals.get(currency) ?? emptyCurrencyTotals(currency);
    current.count += 1;
    current.prevu += Number(budget.montant_total_prevu ?? 0);
    current.realise += Number(budget.montant_total_realise ?? 0);
    current.recettesRealisees += Number(budget.total_recettes_realisees ?? 0);
    current.depensesRealisees += Number(budget.total_depenses_realisees ?? budget.montant_total_realise ?? 0);
    totals.set(currency, current);
  }

  return currencies.map((currency) => totals.get(currency) ?? emptyCurrencyTotals(currency));
}

export function formatCurrencyTotals(totals: CurrencyTotals[], selector: (total: CurrencyTotals) => number) {
  return totals
    .filter((total) => total.count > 0 || selector(total) !== 0)
    .map((total) => formatAmount(selector(total), total.currency))
    .join(" / ") || formatAmount(0, "FC");
}

export function getBudgetRiskAlerts(budgets: Budget[]): BudgetRiskAlert[] {
  return budgets
    .map((budget) => {
      const prevu = Number(budget.montant_total_prevu ?? 0);
      const realise = Number(budget.total_depenses_realisees ?? budget.montant_total_realise ?? 0);
      const taux = prevu > 0 ? (realise / prevu) * 100 : 0;
      return {
        budgetId: budget.id,
        currency: getBudgetCurrency(budget),
        label: `${budget.reference} - ${budget.libelle}`,
        level: taux >= 100 ? "danger" as const : "warning" as const,
        prevu,
        realise,
        taux,
      };
    })
    .filter((alert) => alert.taux >= overspendRiskThreshold)
    .sort((left, right) => right.taux - left.taux);
}

export function getExecutionRiskAlerts(executions: ExecutionBudgetaire[]): BudgetRiskAlert[] {
  return executions
    .map((execution) => {
      const prevu = Number(execution.total_depenses_prevues ?? execution.budget_previsionnel ?? 0);
      const realise = Number(execution.total_depenses_realisees ?? execution.montant_realise_total ?? 0);
      const taux = Number(execution.taux_execution_depenses ?? (prevu > 0 ? (realise / prevu) * 100 : 0));
      return {
        budgetId: execution.budget_id,
        currency: getExecutionCurrency(execution),
        label: `Budget ${execution.budget_id ?? "-"}`,
        level: taux >= 100 ? "danger" as const : "warning" as const,
        prevu,
        realise,
        taux,
      };
    })
    .filter((alert) => alert.taux >= overspendRiskThreshold)
    .sort((left, right) => right.taux - left.taux);
}
