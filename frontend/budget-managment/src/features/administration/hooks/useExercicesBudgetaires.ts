import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exerciceBudgetaireService } from "../../../services/exerciceBudgetaireService";
import type { ExerciceBudgetaireCreate, ExerciceBudgetaireUpdate } from "../../../types/exerciceBudgetaire";

export const exercicesBudgetairesQueryKey = ["exercices-budgetaires"] as const;
export const exerciceActifQueryKey = ["exercice-actif"] as const;

function invalidateExercices(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: exercicesBudgetairesQueryKey });
  void queryClient.invalidateQueries({ queryKey: exerciceActifQueryKey });
}

export function useExercicesBudgetaires() {
  return useQuery({ queryKey: exercicesBudgetairesQueryKey, queryFn: exerciceBudgetaireService.getAll });
}

export function useActiveExerciceBudgetaire() {
  return useQuery({
    queryKey: exerciceActifQueryKey,
    queryFn: exerciceBudgetaireService.getActive,
    retry: false,
  });
}

export function useCreateExerciceBudgetaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExerciceBudgetaireCreate) => exerciceBudgetaireService.create(payload),
    onSuccess: () => invalidateExercices(queryClient),
  });
}

export function useUpdateExerciceBudgetaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExerciceBudgetaireUpdate }) => exerciceBudgetaireService.update(id, payload),
    onSuccess: () => invalidateExercices(queryClient),
  });
}

export function useDeleteExerciceBudgetaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => exerciceBudgetaireService.remove(id),
    onSuccess: () => invalidateExercices(queryClient),
  });
}

export function useOpenExerciceBudgetaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => exerciceBudgetaireService.open(id),
    onSuccess: () => invalidateExercices(queryClient),
  });
}

export function useCloseExerciceBudgetaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => exerciceBudgetaireService.close(id),
    onSuccess: () => invalidateExercices(queryClient),
  });
}
