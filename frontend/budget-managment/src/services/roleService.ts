import { apiClient } from "../api/client";
import type { ApiMessage } from "../types/api";
import type { Role, RoleCreate, RoleUpdate } from "../types/role";

export const roleService = {
  async getAll(): Promise<Role[]> {
    const { data } = await apiClient.get<Role[]>("/roles/");
    return data;
  },
  async getById(id: number): Promise<Role> {
    const { data } = await apiClient.get<Role>(`/roles/${id}`);
    return data;
  },
  async create(payload: RoleCreate): Promise<Role> {
    const { data } = await apiClient.post<Role>("/roles/", payload);
    return data;
  },
  async update(id: number, payload: RoleUpdate): Promise<Role> {
    const { data } = await apiClient.put<Role>(`/roles/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<ApiMessage> {
    const { data } = await apiClient.delete<ApiMessage>(`/roles/${id}`);
    return data;
  },
  async assignPermissions(id: number, permissionIds: number[]): Promise<Role> {
    const { data } = await apiClient.patch<Role>(`/roles/${id}/permissions`, { permission_ids: permissionIds });
    return data;
  },
};
