import { apiClient } from "../api/client";
import type { Projet, ProjetCreate, ProjetUpdate } from "../types/projet";

export const projetService = {
  async getProjects(skip: number = 0, limit: number = 100): Promise<Projet[]> {
    const { data } = await apiClient.get<Projet[]>("/projets/", { params: { skip, limit } });
    return data;
  },

  async getProjectsByDepartement(departementId: number): Promise<Projet[]> {
    const { data } = await apiClient.get<Projet[]>(`/projets/by-departement/${departementId}`);
    return data;
  },

  async getProjectsByGestionnaire(gestionnaireId: number): Promise<Projet[]> {
    const { data } = await apiClient.get<Projet[]>(`/projets/by-gestionnaire/${gestionnaireId}`);
    return data;
  },

  async getProjectsByChef(chefProjetId: number): Promise<Projet[]> {
    const { data } = await apiClient.get<Projet[]>("/projets/", { params: { chef_projet_id: chefProjetId } });
    return data;
  },

  async getProjectById(id: number): Promise<Projet> {
    const { data } = await apiClient.get<Projet>(`/projets/${id}`);
    return data;
  },

  async getProjectByCode(code: string): Promise<Projet> {
    const { data } = await apiClient.get<Projet>(`/projets/by-code/${code}`);
    return data;
  },

  async createProject(payload: ProjetCreate): Promise<Projet> {
    const { data } = await apiClient.post<Projet>("/projets/", payload);
    return data;
  },

  async updateProject(id: number, payload: ProjetUpdate): Promise<Projet> {
    const { data } = await apiClient.put<Projet>(`/projets/${id}`, payload);
    return data;
  },

  async deleteProject(id: number): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/projets/${id}`);
    return data;
  },

  async submitProject(id: number): Promise<Projet> {
    const { data } = await apiClient.patch<Projet>(`/projets/${id}/submit`);
    return data;
  },

  async approveProject(id: number): Promise<Projet> {
    const { data } = await apiClient.patch<Projet>(`/projets/${id}/approve`);
    return data;
  },

  async rejectProject(id: number): Promise<Projet> {
    const { data } = await apiClient.patch<Projet>(`/projets/${id}/reject`);
    return data;
  },

  async closeProject(id: number): Promise<Projet> {
    const { data } = await apiClient.patch<Projet>(`/projets/${id}/close`);
    return data;
  },
};
