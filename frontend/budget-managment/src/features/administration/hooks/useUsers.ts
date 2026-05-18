import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../../services/userService";
import type { UserCreate, UserUpdate } from "../../../types/user";

export const usersQueryKey = ["users"] as const;

export function useUsers() {
  return useQuery({ queryKey: usersQueryKey, queryFn: userService.getAll });
}

export function useUser(id?: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => userService.getById(id ?? 0),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreate) => userService.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdate }) => userService.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.activate(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.deactivate(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}

export function useAssignRolesToUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) => userService.assignRoles(id, roleIds),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}
