import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { PopupModal } from "../../../components/ui/PopupModal";
import { useAuth } from "../../../context/AuthContext";
import { useAppDispatch } from "../../../store";
import { showToast } from "../../../store/slices/uiSlice";
import type { Budget, BudgetCreate, BudgetStatus } from "../../../types/budget";
import type { DraftBudgetLine } from "../../../types/ligneBudgetaire";
import { BudgetForm } from "../components/BudgetForm";
import { BudgetLineForm } from "../components/BudgetLineForm";
import { BudgetLinesTable } from "../components/BudgetLinesTable";
import { BudgetSummaryCard } from "../components/BudgetSummaryCard";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { SubmitBudgetConfirmModal } from "../components/SubmitBudgetConfirmModal";
import { Toast } from "../../administration/components/Toast";
import { useActiveExercice, useBudgetsByProjects, useCategoriesBudgetaires, useCreateBudgetWithLines } from "../hooks/useManagerBudget";
import { useChefProjects } from "../hooks/useManagerProjects";

const budgetLabels: Record<BudgetStatus, string> = {
  brouillon: "Brouillon",
  soumis: "En attente de validation",
  valide: "Valide",
  rejete: "Rejete",
  en_execution: "En execution",
  cloture: "Cloture",
};

const budgetTones: Record<BudgetStatus, string> = {
  brouillon: "bg-slate-100 text-slate-700 ring-slate-200",
  soumis: "bg-amber-50 text-amber-700 ring-amber-200",
  valide: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejete: "bg-rose-50 text-rose-700 ring-rose-200",
  en_execution: "bg-blue-50 text-blue-700 ring-blue-200",
  cloture: "bg-slate-100 text-slate-700 ring-slate-200",
};

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

function BlockingMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-800">{message}</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700">{message}</div>;
}

function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${budgetTones[status]}`}>{budgetLabels[status]}</span>;
}

function CreatedBudgetsTable({ budgets, loading, getProjectTitle }: { budgets: Budget[]; loading?: boolean; getProjectTitle: (projectId?: number | null) => string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Budgets crees</h2>
          <p className="mt-1 text-sm text-slate-500">Suivi des budgets en attente de validation et des budgets deja traites.</p>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Libelle</th>
                <th className="px-4 py-3">Projet</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>Chargement...</td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>Aucun budget cree pour vos projets.</td>
                </tr>
              ) : (
                budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{budget.reference}</td>
                    <td className="px-4 py-3 text-slate-700">{budget.libelle}</td>
                    <td className="px-4 py-3 text-slate-700">{getProjectTitle(budget.projet_id)}</td>
                    <td className="px-4 py-3"><BudgetStatusBadge status={budget.statut} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function CreateProjectBudgetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { authLoading, currentUser, isAuthenticated, isProjectManager } = useAuth();
  const initialProjectId = Number(searchParams.get("projectId")) || "";
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">(initialProjectId);
  const [budgetForm, setBudgetForm] = useState<Pick<BudgetCreate, "reference" | "libelle" | "description">>({
    reference: "",
    libelle: "",
    description: "",
  });
  const [lines, setLines] = useState<DraftBudgetLine[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);

  const projectsQuery = useChefProjects(currentUser?.id);
  const projectIds = useMemo(() => (projectsQuery.data ?? []).map((project) => project.id), [projectsQuery.data]);
  const createdBudgetsQuery = useBudgetsByProjects(projectIds);
  const activeExerciceQuery = useActiveExercice();
  const categoriesQuery = useCategoriesBudgetaires();
  const createBudgetWithLines = useCreateBudgetWithLines();

  const activeExercice = activeExerciceQuery.data;
  const selectedProject = useMemo(
    () => projectsQuery.data?.find((project) => project.id === selectedProjectId),
    [projectsQuery.data, selectedProjectId],
  );
  const projectTitles = useMemo(() => {
    const titles = new Map<number, string>();
    (projectsQuery.data ?? []).forEach((project) => titles.set(project.id, `${project.code} - ${project.titre}`));
    return titles;
  }, [projectsQuery.data]);

  function submitBudget() {
    if (!selectedProjectId) {
      dispatch(showToast({ message: "Veuillez choisir un projet.", type: "error" }));
      setConfirmOpen(false);
      return;
    }
    if (!budgetForm.reference.trim() || !budgetForm.libelle.trim()) {
      dispatch(showToast({ message: "Veuillez renseigner la reference et le libelle du budget.", type: "error" }));
      setConfirmOpen(false);
      return;
    }
    if (lines.length === 0) {
      dispatch(showToast({ message: "Veuillez ajouter au moins une ligne budgetaire avant de soumettre.", type: "error" }));
      setConfirmOpen(false);
      return;
    }
    if (!activeExercice) {
      dispatch(showToast({ message: "Aucun exercice budgetaire ouvert. Impossible de creer un budget.", type: "error" }));
      setConfirmOpen(false);
      return;
    }

    createBudgetWithLines.mutate(
      {
        reference: budgetForm.reference,
        libelle: budgetForm.libelle,
        description: budgetForm.description || undefined,
        projet_id: selectedProjectId,
        lignes: lines,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          dispatch(showToast({ message: "Budget du projet cree et soumis avec succes.", type: "success" }));
          setLines([]);
          setBudgetForm({ reference: "", libelle: "", description: "" });
          setSelectedProjectId("");
        },
        onError: (error) => {
          setConfirmOpen(false);
          dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
        },
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
    return <AccessMessage message="Acces refuse. Seul un Chef de projet peut creer le budget d'un projet." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
            <button className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-950" onClick={() => navigate("/chef/projets")}>
              Retour
            </button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Budget de projet</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Creer le budget d'un projet</h1>
              <p className="mt-2 text-sm text-slate-600">Choisissez un de vos projets et creez son budget dans l'exercice budgetaire ouvert.</p>
            </div>
          </header>

          {activeExerciceQuery.isError ? <BlockingMessage message="Aucun exercice budgetaire ouvert. Contactez l'administrateur." /> : null}
          {projectsQuery.isError ? <ErrorMessage message={getApiErrorMessage(projectsQuery.error)} /> : null}
          {createdBudgetsQuery.isError ? <ErrorMessage message={getApiErrorMessage(createdBudgetsQuery.error)} /> : null}

          <CreatedBudgetsTable
            budgets={createdBudgetsQuery.data ?? []}
            loading={projectsQuery.isLoading || createdBudgetsQuery.isLoading}
            getProjectTitle={(projectId) => (projectId ? projectTitles.get(projectId) ?? String(projectId) : "-")}
          />

          <section className="grid gap-4 rounded-lg bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="project-select">
                Projet
              </label>
              <select
                id="project-select"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                disabled={projectsQuery.isLoading}
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value ? Number(event.target.value) : "")}
              >
                <option value="">{projectsQuery.isLoading ? "Chargement..." : "Choisir un projet"}</option>
                {(projectsQuery.data ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.titre}
                  </option>
                ))}
              </select>
              {projectsQuery.data?.length === 0 ? <p className="mt-2 text-xs font-medium text-amber-700">Aucun projet ne vous est affecte.</p> : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exercice ouvert</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{activeExerciceQuery.isLoading ? "Chargement..." : activeExercice?.libelle ?? "Aucun exercice ouvert"}</p>
            </div>
            {selectedProject ? (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Departement</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedProject.departement?.nom ?? currentUser?.departement?.nom ?? "Departement non renseigne"}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Informations du budget</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {budgetForm.reference || budgetForm.libelle ? `${budgetForm.reference || "Reference non renseignee"} - ${budgetForm.libelle || "Libelle non renseigne"}` : "Aucune information renseignee."}
                </p>
              </div>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setBudgetModalOpen(true)}>
                {budgetForm.reference || budgetForm.libelle ? "Modifier" : "Renseigner"}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Lignes budgetaires</h2>
                <p className="mt-1 text-sm text-slate-500">{lines.length} ligne(s) ajoutee(s).</p>
              </div>
              <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" onClick={() => setLineModalOpen(true)}>
                Ajouter une ligne
              </button>
            </div>
          </section>

          {categoriesQuery.isError ? <ErrorMessage message={getApiErrorMessage(categoriesQuery.error)} /> : null}
          <BudgetLinesTable lines={lines} onRemove={(index) => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
          <BudgetSummaryCard lines={lines} />
          {lines.length > 0 ? (
            <div className="flex justify-end rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <button
                className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60"
                disabled={createBudgetWithLines.isPending || !activeExercice}
                onClick={() => setConfirmOpen(true)}
              >
                {createBudgetWithLines.isPending ? "Envoi en cours..." : "Soumettre pour validation"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <PopupModal open={budgetModalOpen} title="Informations du budget" onClose={() => setBudgetModalOpen(false)}>
        <BudgetForm value={budgetForm} onChange={setBudgetForm} />
        <div className="mt-4 flex justify-end">
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setBudgetModalOpen(false)}>
            Valider
          </button>
        </div>
      </PopupModal>
      <PopupModal open={lineModalOpen} title="Ajouter une ligne budgetaire" onClose={() => setLineModalOpen(false)}>
        <BudgetLineForm
          categories={categoriesQuery.data ?? []}
          onAdd={(line) => {
            setLines((current) => [...current, line]);
            setLineModalOpen(false);
            dispatch(showToast({ message: "Ligne budgetaire ajoutee.", type: "success" }));
          }}
          onError={(message) => dispatch(showToast({ message, type: "error" }))}
        />
      </PopupModal>
      <SubmitBudgetConfirmModal loading={createBudgetWithLines.isPending} open={confirmOpen} onCancel={() => setConfirmOpen(false)} onConfirm={submitBudget} />
      <Toast />
    </main>
  );
}
