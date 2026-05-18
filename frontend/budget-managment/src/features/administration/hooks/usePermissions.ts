import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionService } from "../../../services/permissionService";
import type { PermissionCreate, PermissionUpdate } from "../../../types/permission";

export const permissionsQueryKey = ["permissions"] as const;

export function usePermissions() {
  return useQuery({ queryKey: permissionsQueryKey, queryFn: permissionService.getAll });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PermissionCreate) => permissionService.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: permissionsQueryKey }),
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PermissionUpdate }) => permissionService.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: permissionsQueryKey }),
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => permissionService.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: permissionsQueryKey }),
  });
}
