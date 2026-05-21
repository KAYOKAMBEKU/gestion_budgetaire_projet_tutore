import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projetService } from "../../../services/projetService";

export function useManagerProjects(departementId?: number) {
  return useQuery({
    queryKey: ["projets", "departement", departementId],
    queryFn: () => projetService.getProjectsByDepartement(departementId ?? 0),
    enabled: Boolean(departementId),
  });
}

export function useProject(projectId?: number) {
  return useQuery({
    queryKey: ["projets", projectId],
    queryFn: () => projetService.getProjectById(projectId ?? 0),
    enabled: Boolean(projectId),
  });
}

export function useSubmitProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projetService.submitProject(id),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ["projets"] });
      void queryClient.invalidateQueries({ queryKey: ["projets", project.id] });
    },
  });
}

export function useValidateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projetService.approveProject(id),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ["projets"] });
      void queryClient.invalidateQueries({ queryKey: ["projets", project.id] });
    },
  });
}

export function useRejectProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projetService.rejectProject(id),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ["projets"] });
      void queryClient.invalidateQueries({ queryKey: ["projets", project.id] });
    },
  });
}

export function useCloseProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projetService.closeProject(id),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ["projets"] });
      void queryClient.invalidateQueries({ queryKey: ["projets", project.id] });
    },
  });
}
