import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departementService } from "../../../services/departementService";

export function useDepartements() {
  return useQuery({
    queryKey: ["departements"],
    queryFn: departementService.getAll,
  });
}

export function useChefsProjetByDepartement(departementId?: number) {
  return useQuery({
    queryKey: ["departements", departementId, "chefs-projet"],
    queryFn: () => departementService.getChefsProjetByDepartement(departementId ?? 0),
    enabled: Boolean(departementId),
  });
}

export function useAvailableChefsProjet(departementId?: number) {
  return useQuery({
    queryKey: ["departements", departementId, "chefs-projet", "available"],
    queryFn: () => departementService.getAvailableChefsProjet(departementId),
    enabled: Boolean(departementId),
  });
}

export function useAssignChefProjet(departementId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => departementService.assignChefProjet(departementId ?? 0, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["departements", departementId, "chefs-projet"] });
      void queryClient.invalidateQueries({ queryKey: ["departements", departementId, "chefs-projet", "available"] });
      void queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}

export function useRemoveChefProjet(departementId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => departementService.removeChefProjet(departementId ?? 0, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["departements", departementId, "chefs-projet"] });
      void queryClient.invalidateQueries({ queryKey: ["departements", departementId, "chefs-projet", "available"] });
      void queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}
