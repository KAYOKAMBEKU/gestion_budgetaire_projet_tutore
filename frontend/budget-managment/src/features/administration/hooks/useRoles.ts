import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleService } from "../../../services/roleService";
import type { RoleCreate, RoleUpdate } from "../../../types/role";

export const rolesQueryKey = ["roles"] as const;

export function useRoles() {
  return useQuery({ queryKey: rolesQueryKey, queryFn: roleService.getAll });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoleCreate) => roleService.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RoleUpdate }) => roleService.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roleService.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
  });
}

export function useAssignPermissionsToRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: number; permissionIds: number[] }) => roleService.assignPermissions(id, permissionIds),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
  });
}
