import { apiClient } from "../api/client";
import type { ApiMessage } from "../types/api";
import type { User, UserCreate, UserUpdate } from "../types/user";

export const userService = {
  async getAll(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/users/");
    return data;
  },
  async getById(id: number): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },
  async create(payload: UserCreate): Promise<User> {
    const { data } = await apiClient.post<User>("/users/", payload);
    return data;
  },
  async update(id: number, payload: UserUpdate): Promise<User> {
    const { data } = await apiClient.put<User>(`/users/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<ApiMessage> {
    const { data } = await apiClient.delete<ApiMessage>(`/users/${id}`);
    return data;
  },
  async activate(id: number): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}/activate`);
    return data;
  },
  async deactivate(id: number): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}/deactivate`);
    return data;
  },
  async assignRoles(id: number, roleIds: number[]): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}/roles`, { role_ids: roleIds });
    return data;
  },
};
