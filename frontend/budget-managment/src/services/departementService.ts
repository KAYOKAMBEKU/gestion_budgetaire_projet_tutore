import { apiClient } from "../api/client";
import type { ApiMessage } from "../types/api";
import type { Departement, DepartementCreate, DepartementUpdate } from "../types/departement";
import type { User } from "../types/user";

export const departementService = {
  async getAll(): Promise<Departement[]> {
    const { data } = await apiClient.get<Departement[]>("/departements/");
    return data;
  },
  async getAvailableGestionnaires(departementId?: number): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/departements/gestionnaires/available", { params: { departement_id: departementId } });
    return data;
  },
  async getGestionnairesByDepartement(departementId: number): Promise<User[]> {
    const { data } = await apiClient.get<User[]>(`/departements/${departementId}/gestionnaires`);
    return data;
  },
  async getAvailableChefsProjet(departementId?: number): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/departements/chefs-projet/available", { params: { departement_id: departementId } });
    return data;
  },
  async getChefsProjetByDepartement(departementId: number): Promise<User[]> {
    const { data } = await apiClient.get<User[]>(`/departements/${departementId}/chefs-projet`);
    return data;
  },
  async assignChefProjet(departementId: number, userId: number): Promise<User> {
    const { data } = await apiClient.patch<User>(`/departements/${departementId}/assign-chef-projet/${userId}`);
    return data;
  },
  async removeChefProjet(departementId: number, userId: number): Promise<User> {
    const { data } = await apiClient.patch<User>(`/departements/${departementId}/remove-chef-projet/${userId}`);
    return data;
  },
  async getDepartementById(id: number): Promise<Departement> {
    const { data } = await apiClient.get<Departement>(`/departements/${id}`);
    return data;
  },
  async create(payload: DepartementCreate): Promise<Departement> {
    const { data } = await apiClient.post<Departement>("/departements/", payload);
    return data;
  },
  async update(id: number, payload: DepartementUpdate): Promise<Departement> {
    const { data } = await apiClient.put<Departement>(`/departements/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<ApiMessage> {
    const { data } = await apiClient.delete<ApiMessage>(`/departements/${id}`);
    return data;
  },
  async activate(id: number): Promise<Departement> {
    const { data } = await apiClient.patch<Departement>(`/departements/${id}/activate`);
    return data;
  },
  async deactivate(id: number): Promise<Departement> {
    const { data } = await apiClient.patch<Departement>(`/departements/${id}/deactivate`);
    return data;
  },
};
