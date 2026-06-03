import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { PopupModal } from "../../../components/ui/PopupModal";
import { useAuth } from "../../../context/AuthContext";
import { useAppDispatch } from "../../../store";
import { showToast } from "../../../store/slices/uiSlice";
import type { ProjetCreate } from "../../../types/projet";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { ProjectStatusBadge } from "../components/ProjectStatusBadge";
import { Toast } from "../../administration/components/Toast";
import { useActiveExercice, useBudgetsByProjects } from "../hooks/useManagerBudget";
import { useCreateProject, useChefProjects } from "../hooks/useManagerProjects";

function AccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F7FA] p-6">
      <div className="max-w-lg rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
        <h1 className="text-xl font-bold text-[#1F2937]">{title}</h1>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
      </div>
    </main>
  );
}

const emptyForm: Omit<ProjetCreate, "departement_id" | "exercice_id"> = {
  titre: "",
  description: "",
  objectif: "",
  resultat_attendu: "",
  date_debut_prevue: "",
  date_fin_prevue: "",
  cout_estime: undefined,
};

export function ChefProjectsPage() {
  const dispatch = useAppDispatch();
  const { authLoading, currentUser, isAuthenticated, isProjectManager } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const projectsQuery = useChefProjects(currentUser?.id);
  const projectIds = useMemo(() => (projectsQuery.data ?? []).map((project) => project.id), [projectsQuery.data]);
  const budgetsQuery = useBudgetsByProjects(projectIds);
  const budgetProjectIds = useMemo(() => new Set((budgetsQuery.data ?? []).map((budget) => budget.projet_id)), [budgetsQuery.data]);
  const activeExerciceQuery = useActiveExercice();
  const createProject = useCreateProject();

  function updateForm<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitProject() {
    if (!form.titre.trim()) {
      dispatch(showToast({ message: "Veuillez renseigner le nom du projet.", type: "error" }));
      return;
    }
    if (!currentUser?.departement_id) {
      dispatch(showToast({ message: "Votre compte Chef de projet n'est rattache a aucun departement.", type: "error" }));
      return;
    }
    if (!activeExerciceQuery.data) {
      dispatch(showToast({ message: "Aucun exercice budgetaire ouvert. Impossible de creer un projet.", type: "error" }));
      return;
    }
    if (form.date_debut_prevue && form.date_fin_prevue && form.date_fin_prevue < form.date_debut_prevue) {
      dispatch(showToast({ message: "La date de fin du projet doit etre posterieure a la date de debut.", type: "error" }));
      return;
    }

    createProject.mutate(
      {
        titre: form.titre,
        description: form.description || undefined,
        objectif: form.objectif || undefined,
        resultat_attendu: form.resultat_attendu || undefined,
        date_debut_prevue: form.date_debut_prevue || undefined,
        date_fin_prevue: form.date_fin_prevue || undefined,
        cout_estime: form.cout_estime,
        departement_id: currentUser.departement_id,
        exercice_id: activeExerciceQuery.data.id,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setForm(emptyForm);
          dispatch(showToast({ message: "Projet cree avec succes.", type: "success" }));
        },
        onError: (error) => dispatch(showToast({ message: getApiErrorMessage(error), type: "error" })),
      },
    );
  }

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isProjectManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Chef de projet." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Espace Chef de projet</p>
                <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Mes projets</h1>
                <p className="mt-2 text-sm text-[#6B7280]">Creez un projet, choisissez le departement destinataire, puis creez son budget.</p>
              </div>
              <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#166F48]" onClick={() => setIsCreateOpen(true)}>
                Creer un projet
              </button>
            </div>
          </header>

          {activeExerciceQuery.isError ? (
            <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-left text-sm font-medium text-[#92400E]">
              Aucun exercice budgetaire ouvert. La creation de projet reste indisponible.
            </div>
          ) : null}
          {budgetsQuery.isError ? (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-left text-sm font-medium text-[#DC2626]">
              {getApiErrorMessage(budgetsQuery.error)}
            </div>
          ) : null}

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#E5E7EB]">
            {projectsQuery.isLoading ? (
              <p className="py-10 text-center text-sm font-semibold text-[#6B7280]">Chargement des projets...</p>
            ) : projectsQuery.data?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <th className="px-4 py-3 font-semibold text-[#374151]">Code</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Titre</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Departement</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Statut</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsQuery.data.map((project) => (
                      <tr key={project.id} className="border-b border-[#E5E7EB] hover:bg-[#F4F7FA]">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#374151]">{project.code}</td>
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">{project.titre}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{project.departement?.nom ?? project.departement_id}</td>
                        <td className="px-4 py-3"><ProjectStatusBadge status={project.statut} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-3">
                            {budgetsQuery.isLoading ? (
                              <span className="text-[#6B7280]">Verification...</span>
                            ) : budgetProjectIds.has(project.id) ? (
                              <span className="text-[#9CA3AF]">-</span>
                            ) : (
                              <Link className="text-[#16A34A] hover:text-[#166F48] hover:underline" to={`/chef/budgets?projectId=${project.id}`}>
                                Creer le budget
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-[#F9FAFB] py-12 text-center">
                <p className="text-sm font-semibold text-[#6B7280]">Aucun projet cree pour le moment.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <PopupModal open={isCreateOpen} title="Creer un projet" onClose={() => setIsCreateOpen(false)}>
        <div className="grid gap-4 text-left">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Nom du projet
              <input className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" value={form.titre} onChange={(event) => updateForm("titre", event.target.value)} />
            </label>
            <div className="rounded-md bg-[#F9FAFB] px-3 py-2 text-sm text-[#6B7280]">
              Code projet: <span className="font-semibold text-[#1F2937]">genere automatiquement</span>
            </div>
          </div>
          <div className="grid gap-3 rounded-md bg-[#F9FAFB] px-3 py-3 text-sm text-[#6B7280] sm:grid-cols-3">
            <p>Departement: <span className="font-semibold text-[#1F2937]">{currentUser?.departement?.nom ?? currentUser?.departement_id ?? "Non renseigne"}</span></p>
            <p>Chef de projet: <span className="font-semibold text-[#1F2937]">{currentUser ? `${currentUser.prenom ?? ""} ${currentUser.nom}`.trim() : "-"}</span></p>
            <p>Statut: <span className="font-semibold text-[#1F2937]">Brouillon</span></p>
          </div>
          <label className="grid gap-1 text-sm font-semibold text-[#374151]">
            Description
            <textarea className="min-h-20 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[#374151]">
            Objectif
            <textarea className="min-h-20 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" value={form.objectif} onChange={(event) => updateForm("objectif", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[#374151]">
            Resultat attendu
            <textarea className="min-h-20 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" value={form.resultat_attendu} onChange={(event) => updateForm("resultat_attendu", event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Debut prevu
              <input className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" type="date" value={form.date_debut_prevue} onChange={(event) => updateForm("date_debut_prevue", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Fin prevue
              <input className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" type="date" value={form.date_fin_prevue} onChange={(event) => updateForm("date_fin_prevue", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Cout estime
              <input className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" min="0" type="number" value={form.cout_estime ?? ""} onChange={(event) => updateForm("cout_estime", event.target.value ? Number(event.target.value) : undefined)} />
            </label>
          </div>
          <div className="rounded-md bg-[#F9FAFB] px-3 py-2 text-sm text-[#6B7280]">
            Exercice: <span className="font-semibold text-[#1F2937]">{activeExerciceQuery.data?.libelle ?? "Aucun exercice ouvert"}</span>
          </div>
          <div className="flex justify-end gap-3">
            <button className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#F4F7FA]" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </button>
            <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#166F48] disabled:opacity-60" disabled={createProject.isPending || !activeExerciceQuery.data} onClick={submitProject}>
              {createProject.isPending ? "Creation..." : "Creer"}
            </button>
          </div>
        </div>
      </PopupModal>
      <Toast />
    </main>
  );
}
