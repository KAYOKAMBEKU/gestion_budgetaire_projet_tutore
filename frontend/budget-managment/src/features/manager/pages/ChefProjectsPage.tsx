import { useState } from "react";
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
import { useActiveExercice } from "../hooks/useManagerBudget";
import { useCreateProject, useChefProjects } from "../hooks/useManagerProjects";
import { useDepartements } from "../hooks/useDepartements";

function AccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="max-w-lg rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </main>
  );
}

const emptyForm: Omit<ProjetCreate, "departement_id" | "exercice_id"> & { departement_id: number | "" } = {
  code: "",
  titre: "",
  description: "",
  objectif: "",
  resultat_attendu: "",
  date_debut_prevue: "",
  date_fin_prevue: "",
  cout_estime: undefined,
  departement_id: "",
};

export function ChefProjectsPage() {
  const dispatch = useAppDispatch();
  const { authLoading, currentUser, isAuthenticated, isProjectManager } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const projectsQuery = useChefProjects(currentUser?.id);
  const departementsQuery = useDepartements();
  const activeExerciceQuery = useActiveExercice();
  const createProject = useCreateProject();

  function updateForm<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitProject() {
    if (!form.code.trim() || !form.titre.trim() || !form.departement_id) {
      dispatch(showToast({ message: "Veuillez renseigner le code, le titre et le departement du projet.", type: "error" }));
      return;
    }
    if (!activeExerciceQuery.data) {
      dispatch(showToast({ message: "Aucun exercice budgetaire ouvert. Impossible de creer un projet.", type: "error" }));
      return;
    }

    createProject.mutate(
      {
        code: form.code,
        titre: form.titre,
        description: form.description || undefined,
        objectif: form.objectif || undefined,
        resultat_attendu: form.resultat_attendu || undefined,
        date_debut_prevue: form.date_debut_prevue || undefined,
        date_fin_prevue: form.date_fin_prevue || undefined,
        cout_estime: form.cout_estime,
        departement_id: form.departement_id,
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
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-600">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isProjectManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Chef de projet." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Espace Chef de projet</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Mes projets</h1>
                <p className="mt-2 text-sm text-slate-600">Creez un projet, choisissez le departement destinataire, puis creez son budget.</p>
              </div>
              <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" onClick={() => setIsCreateOpen(true)}>
                Creer un projet
              </button>
            </div>
          </header>

          {activeExerciceQuery.isError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-800">
              Aucun exercice budgetaire ouvert. La creation de projet reste indisponible.
            </div>
          ) : null}

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {projectsQuery.isLoading ? (
              <p className="py-10 text-center text-sm font-semibold text-slate-600">Chargement des projets...</p>
            ) : projectsQuery.data?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 font-semibold text-slate-700">Code</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Titre</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Departement</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Statut</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsQuery.data.map((project) => (
                      <tr key={project.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{project.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-950">{project.titre}</td>
                        <td className="px-4 py-3 text-slate-600">{project.departement?.nom ?? project.departement_id}</td>
                        <td className="px-4 py-3"><ProjectStatusBadge status={project.statut} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-3">
                            <Link className="text-emerald-600 hover:text-emerald-700 hover:underline" to={`/chef/budgets/create?projectId=${project.id}`}>
                              Creer le budget
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                <p className="text-sm font-semibold text-slate-600">Aucun projet cree pour le moment.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <PopupModal open={isCreateOpen} title="Creer un projet" onClose={() => setIsCreateOpen(false)}>
        <div className="grid gap-4 text-left">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Code
              <input className="rounded-md border border-slate-200 px-3 py-2 font-normal" value={form.code} onChange={(event) => updateForm("code", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Titre
              <input className="rounded-md border border-slate-200 px-3 py-2 font-normal" value={form.titre} onChange={(event) => updateForm("titre", event.target.value)} />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Departement destinataire
            <select className="rounded-md border border-slate-200 px-3 py-2 font-normal" value={form.departement_id} onChange={(event) => updateForm("departement_id", event.target.value ? Number(event.target.value) : "")}>
              <option value="">{departementsQuery.isLoading ? "Chargement..." : "Choisir un departement"}</option>
              {(departementsQuery.data ?? []).filter((departement) => departement.statut === "actif").map((departement) => (
                <option key={departement.id} value={departement.id}>{departement.nom}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Description
            <textarea className="min-h-20 rounded-md border border-slate-200 px-3 py-2 font-normal" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Objectif
            <textarea className="min-h-20 rounded-md border border-slate-200 px-3 py-2 font-normal" value={form.objectif} onChange={(event) => updateForm("objectif", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Resultat attendu
            <textarea className="min-h-20 rounded-md border border-slate-200 px-3 py-2 font-normal" value={form.resultat_attendu} onChange={(event) => updateForm("resultat_attendu", event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Debut prevu
              <input className="rounded-md border border-slate-200 px-3 py-2 font-normal" type="date" value={form.date_debut_prevue} onChange={(event) => updateForm("date_debut_prevue", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Fin prevue
              <input className="rounded-md border border-slate-200 px-3 py-2 font-normal" type="date" value={form.date_fin_prevue} onChange={(event) => updateForm("date_fin_prevue", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Cout estime
              <input className="rounded-md border border-slate-200 px-3 py-2 font-normal" min="0" type="number" value={form.cout_estime ?? ""} onChange={(event) => updateForm("cout_estime", event.target.value ? Number(event.target.value) : undefined)} />
            </label>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Exercice: <span className="font-semibold text-slate-950">{activeExerciceQuery.data?.libelle ?? "Aucun exercice ouvert"}</span>
          </div>
          <div className="flex justify-end gap-3">
            <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </button>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={createProject.isPending || !activeExerciceQuery.data} onClick={submitProject}>
              {createProject.isPending ? "Creation..." : "Creer"}
            </button>
          </div>
        </div>
      </PopupModal>
      <Toast />
    </main>
  );
}
