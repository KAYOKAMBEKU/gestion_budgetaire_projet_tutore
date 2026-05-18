import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departementService } from "../../../services/departementService";
import type { DepartementCreate, DepartementUpdate } from "../../../types/departement";

export const departementsQueryKey = ["departements"] as const;

export function useDepartements() {
  return useQuery({ queryKey: departementsQueryKey, queryFn: departementService.getAll });
}

export function useCreateDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartementCreate) => departementService.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: departementsQueryKey }),
  });
}

export function useUpdateDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DepartementUpdate }) => departementService.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: departementsQueryKey }),
  });
}

export function useDeleteDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departementService.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: departementsQueryKey }),
  });
}

export function useActivateDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departementService.activate(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: departementsQueryKey }),
  });
}

export function useDeactivateDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departementService.deactivate(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: departementsQueryKey }),
  });
}
