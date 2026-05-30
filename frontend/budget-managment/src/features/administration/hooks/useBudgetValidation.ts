import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetService } from "../../../services/budgetService";

export function useSubmittedBudgets() {
  return useQuery({
    queryKey: ["budgets", "soumis-admin"],
    queryFn: () => budgetService.getBudgetsByStatut("soumis_admin"),
  });
}

export function useValidatedBudgets() {
  return useQuery({
    queryKey: ["budgets", "approuves-admin"],
    queryFn: async () => {
      const statuses = ["approuve_admin", "en_execution", "execute", "cloture"];
      const budgets = await Promise.all(statuses.map((status) => budgetService.getBudgetsByStatut(status)));
      return budgets.flat();
    },
  });
}

export function useApproveBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetService.approveBudget(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", "soumis-admin"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", "approuves-admin"] });
    },
  });
}

export function useRejectBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetService.rejectBudget(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", "soumis-admin"] });
    },
  });
}

export function useStartBudgetExecution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetService.startExecution(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets", "approuves-admin"] });
    },
  });
}
