import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetService } from "../../../services/budgetService";

export function useSubmittedBudgets() {
  return useQuery({
    queryKey: ["budgets", "soumis"],
    queryFn: () => budgetService.getBudgetsByStatut("soumis"),
  });
}

export function useValidatedBudgets() {
  return useQuery({
    queryKey: ["budgets", "valide"],
    queryFn: () => budgetService.getBudgetsByStatut("valide"),
  });
}

export function useApproveBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetService.approveBudget(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", "soumis"] });
    },
  });
}

export function useRejectBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetService.rejectBudget(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", "soumis"] });
    },
  });
}
