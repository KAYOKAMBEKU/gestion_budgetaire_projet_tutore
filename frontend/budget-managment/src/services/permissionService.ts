import { apiClient } from "../api/client";
import type { ApiMessage } from "../types/api";
import type { Permission, PermissionCreate, PermissionUpdate } from "../types/permission";

export const permissionService = {
  async getAll(): Promise<Permission[]> {
    const { data } = await apiClient.get<Permission[]>("/permissions/");
    return data;
  },
  async create(payload: PermissionCreate): Promise<Permission> {
    const { data } = await apiClient.post<Permission>("/permissions/", payload);
    return data;
  },
  async update(id: number, payload: PermissionUpdate): Promise<Permission> {
    const { data } = await apiClient.put<Permission>(`/permissions/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<ApiMessage> {
    const { data } = await apiClient.delete<ApiMessage>(`/permissions/${id}`);
    return data;
  },
};
