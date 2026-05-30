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
import { useActiveExercice, useBudgetsByProjects, useCategoriesBudgetaires, useCreateBudgetWithLines, useSaveBudgetDraftWithLines } from "../hooks/useManagerBudget";
import { useChefProjects } from "../hooks/useManagerProjects";
import { formatAmount } from "../utils/formatAmount";

const budgetLabels: Record<BudgetStatus, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  soumis_gestionnaire: "Soumis au Gestionnaire",
  valide: "Valide",
  valide_gestionnaire: "Valide par le Gestionnaire",
  soumis_admin: "Soumis a l'Administrateur",
  approuve_admin: "Approuve par l'Administrateur",
  rejete: "Rejete",
  rejete_gestionnaire: "Rejete par le Gestionnaire",
  rejete_admin: "Rejete par l'Administrateur",
  en_execution: "En execution",
  execute: "Execute",
  cloture: "Cloture",
};

const budgetTones: Record<BudgetStatus, string> = {
  brouillon: "bg-[#F4F7FA] text-[#374151] ring-[#E5E7EB]",
  soumis: "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  soumis_gestionnaire: "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]",
  valide: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  valide_gestionnaire: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  soumis_admin: "bg-[#EDE9FE] text-[#7C3AED] ring-[#DDD6FE]",
  approuve_admin: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  rejete: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  rejete_gestionnaire: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  rejete_admin: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
  en_execution: "bg-[#DBEAFE] text-[#2563EB] ring-blue-200",
  execute: "bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]",
  cloture: "bg-[#F4F7FA] text-[#374151] ring-[#E5E7EB]",
};

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

function BlockingMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-left text-sm font-medium text-[#92400E]">{message}</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-left text-sm font-medium text-[#DC2626]">{message}</div>;
}

function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${budgetTones[status]}`}>{budgetLabels[status]}</span>;
}

function CreatedBudgetsTable({ budgets, loading, getProjectTitle }: { budgets: Budget[]; loading?: boolean; getProjectTitle: (projectId?: number | null) => string }) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937]">Budgets crees</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Suivi des budgets en attente de validation et des budgets deja traites.</p>
        </div>
      </div>
      <div className="mt-4 overflow-hidden border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-[#F9FAFB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
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
                  <td className="px-4 py-6 text-center text-[#6B7280]" colSpan={4}>Chargement...</td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#6B7280]" colSpan={4}>Aucun budget cree pour vos projets.</td>
                </tr>
              ) : (
                budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td className="px-4 py-3 font-semibold text-[#1F2937]">{budget.reference}</td>
                    <td className="px-4 py-3 text-[#374151]">{budget.libelle}</td>
                    <td className="px-4 py-3 text-[#374151]">{getProjectTitle(budget.projet_id)}</td>
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
  const [budgetDates, setBudgetDates] = useState({ date_debut: "", date_fin: "" });
  const [lines, setLines] = useState<DraftBudgetLine[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetInfoSubmitted, setBudgetInfoSubmitted] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);

  const projectsQuery = useChefProjects(currentUser?.id);
  const projectIds = useMemo(() => (projectsQuery.data ?? []).map((project) => project.id), [projectsQuery.data]);
  const createdBudgetsQuery = useBudgetsByProjects(projectIds);
  const activeExerciceQuery = useActiveExercice();
  const categoriesQuery = useCategoriesBudgetaires();
  const createBudgetWithLines = useCreateBudgetWithLines();
  const saveBudgetDraftWithLines = useSaveBudgetDraftWithLines();

  const activeExercice = activeExerciceQuery.data;
  const selectedProject = useMemo(
    () => projectsQuery.data?.find((project) => project.id === selectedProjectId),
    [projectsQuery.data, selectedProjectId],
  );
  const effectiveBudgetDates = {
    date_debut: budgetDates.date_debut || selectedProject?.date_debut_prevue || "",
    date_fin: budgetDates.date_fin || selectedProject?.date_fin_prevue || "",
  };
  const selectedProjectBudget = useMemo(
    () => (createdBudgetsQuery.data ?? []).find((budget) => budget.projet_id === selectedProjectId),
    [createdBudgetsQuery.data, selectedProjectId],
  );
  const selectedExecutionBudget = useMemo(
    () => (createdBudgetsQuery.data ?? []).find((budget) => budget.projet_id === selectedProjectId && budget.statut === "en_execution"),
    [createdBudgetsQuery.data, selectedProjectId],
  );
  const isBudgetLocked = selectedProjectBudget ? !["brouillon", "rejete", "rejete_gestionnaire", "rejete_admin"].includes(selectedProjectBudget.statut) : false;
  const hasExecutionBudget = Boolean(selectedExecutionBudget);
  const footerBudget = selectedExecutionBudget ?? selectedProjectBudget;
  const budgetPrevisionnel = Number(footerBudget?.montant_total_prevu ?? 0) || lines.reduce((sum, line) => sum + Number(line.montant_prevu || 0), 0);
  const budgetRealise = Number(footerBudget?.montant_total_realise ?? 0);
  const projectTitles = useMemo(() => {
    const titles = new Map<number, string>();
    (projectsQuery.data ?? []).forEach((project) => titles.set(project.id, `${project.code} - ${project.titre}`));
    return titles;
  }, [projectsQuery.data]);

  function validateBudgetDraft() {
    if (!budgetInfoSubmitted) {
      dispatch(showToast({ message: "Veuillez d'abord soumettre les informations budgetaires.", type: "error" }));
      return false;
    }
    if (!selectedProjectId) {
      dispatch(showToast({ message: "Veuillez choisir un projet.", type: "error" }));
      return false;
    }
    if (!budgetForm.reference.trim() || !budgetForm.libelle.trim()) {
      dispatch(showToast({ message: "Veuillez renseigner la reference et le libelle du budget.", type: "error" }));
      return false;
    }
    if (lines.length === 0) {
      dispatch(showToast({ message: "Veuillez ajouter au moins une ligne budgetaire.", type: "error" }));
      return false;
    }
    if (!activeExercice) {
      dispatch(showToast({ message: "Aucun exercice budgetaire ouvert. Impossible de creer un budget.", type: "error" }));
      return false;
    }
    if (hasExecutionBudget) {
      dispatch(showToast({ message: "Ce projet a deja un budget en cours d'execution. Impossible de creer un autre budget.", type: "error" }));
      return false;
    }
    if (selectedProjectBudget) {
      dispatch(showToast({ message: "Un budget existe deja pour ce projet.", type: "error" }));
      return false;
    }
    if (effectiveBudgetDates.date_debut && selectedProject?.date_debut_prevue && effectiveBudgetDates.date_debut < selectedProject.date_debut_prevue) {
      dispatch(showToast({ message: "La date de debut du budget ne doit pas preceder celle du projet.", type: "error" }));
      return false;
    }
    if (effectiveBudgetDates.date_fin && selectedProject?.date_fin_prevue && effectiveBudgetDates.date_fin > selectedProject.date_fin_prevue) {
      dispatch(showToast({ message: "La date de fin du budget ne doit pas depasser celle du projet.", type: "error" }));
      return false;
    }
    if (effectiveBudgetDates.date_debut && effectiveBudgetDates.date_fin && effectiveBudgetDates.date_fin < effectiveBudgetDates.date_debut) {
      dispatch(showToast({ message: "La date de fin du budget doit etre posterieure a sa date de debut.", type: "error" }));
      return false;
    }
    return true;
  }

  function resetBudgetDraft() {
    setLines([]);
    setBudgetForm({ reference: "", libelle: "", description: "" });
    setBudgetDates({ date_debut: "", date_fin: "" });
    setSelectedProjectId("");
    setBudgetInfoSubmitted(false);
  }

  function validateBudgetInfo() {
    if (!selectedProjectId) {
      dispatch(showToast({ message: "Veuillez choisir un projet.", type: "error" }));
      return;
    }
    if (!budgetForm.reference.trim() || !budgetForm.libelle.trim()) {
      dispatch(showToast({ message: "Veuillez renseigner la reference et le libelle du budget.", type: "error" }));
      return;
    }
    if (!activeExercice) {
      dispatch(showToast({ message: "Aucun exercice budgetaire ouvert. Impossible de creer un budget.", type: "error" }));
      return;
    }
    if (hasExecutionBudget) {
      dispatch(showToast({ message: "Ce projet a deja un budget en cours d'execution. Impossible de creer un autre budget.", type: "error" }));
      return;
    }
    if (selectedProjectBudget) {
      dispatch(showToast({ message: "Un budget existe deja pour ce projet.", type: "error" }));
      return;
    }
    if (effectiveBudgetDates.date_debut && selectedProject?.date_debut_prevue && effectiveBudgetDates.date_debut < selectedProject.date_debut_prevue) {
      dispatch(showToast({ message: "La date de debut du budget ne doit pas preceder celle du projet.", type: "error" }));
      return;
    }
    if (effectiveBudgetDates.date_fin && selectedProject?.date_fin_prevue && effectiveBudgetDates.date_fin > selectedProject.date_fin_prevue) {
      dispatch(showToast({ message: "La date de fin du budget ne doit pas depasser celle du projet.", type: "error" }));
      return;
    }
    if (effectiveBudgetDates.date_debut && effectiveBudgetDates.date_fin && effectiveBudgetDates.date_fin < effectiveBudgetDates.date_debut) {
      dispatch(showToast({ message: "La date de fin du budget doit etre posterieure a sa date de debut.", type: "error" }));
      return;
    }
    setBudgetInfoSubmitted(true);
    setBudgetModalOpen(false);
    dispatch(showToast({ message: "Informations budgetaires validees. Vous pouvez ajouter les lignes.", type: "success" }));
  }

  function saveDraft() {
    if (!validateBudgetDraft()) {
      return;
    }
    saveBudgetDraftWithLines.mutate(
      {
        reference: budgetForm.reference,
        libelle: budgetForm.libelle,
        description: budgetForm.description || undefined,
        projet_id: selectedProjectId as number,
        lignes: lines,
      },
      {
        onSuccess: () => {
          dispatch(showToast({ message: "Budget enregistre en brouillon.", type: "success" }));
          resetBudgetDraft();
        },
        onError: (error) => dispatch(showToast({ message: getApiErrorMessage(error), type: "error" })),
      },
    );
  }

  function submitBudget() {
    if (!validateBudgetDraft()) {
      setConfirmOpen(false);
      return;
    }

    createBudgetWithLines.mutate(
      {
        reference: budgetForm.reference,
        libelle: budgetForm.libelle,
        description: budgetForm.description || undefined,
        projet_id: selectedProjectId as number,
        lignes: lines,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          dispatch(showToast({ message: "Budget du projet cree et soumis avec succes.", type: "success" }));
          resetBudgetDraft();
        },
        onError: (error) => {
          setConfirmOpen(false);
          dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
        },
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
    return <AccessMessage message="Acces refuse. Seul un Chef de projet peut creer le budget d'un projet." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
              <button className="mb-4 text-sm font-semibold text-[#6B7280] hover:text-[#1F2937]" onClick={() => navigate("/chef/projets")}>
                Retour
              </button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Budget de projet</p>
              <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Creer le budget d'un projet</h1>
              <p className="mt-2 text-sm text-[#6B7280]">Choisissez un de vos projets et creez son budget previsionnel dans l'exercice budgetaire ouvert.</p>
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

          {selectedProjectBudget ? (
            <BlockingMessage message={hasExecutionBudget ? "Ce projet a deja un budget en cours d'execution. Vous ne pouvez pas creer un autre budget pour ce projet." : isBudgetLocked ? "Ce budget est deja soumis. Il n'est plus modifiable librement." : "Un budget existe deja pour ce projet. Une correction depend du statut et des regles backend."} />
          ) : null}

          <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Informations du budget</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {budgetInfoSubmitted ? `${budgetForm.reference} - ${budgetForm.libelle}` : "Renseignez les informations budgetaires avant d'ajouter les lignes."}
                </p>
                {selectedProject ? <p className="mt-1 text-xs font-semibold text-[#0F3D5E]">{selectedProject.code} - {selectedProject.titre}</p> : null}
              </div>
              <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2D46] disabled:opacity-60" disabled={hasExecutionBudget || Boolean(selectedProjectBudget)} onClick={() => setBudgetModalOpen(true)}>
                {budgetInfoSubmitted ? "Modifier" : "Renseigner le budget"}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Lignes budgetaires</h2>
                <p className="mt-1 text-sm text-[#6B7280]">{lines.length} ligne(s) ajoutee(s).</p>
              </div>
              <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#166F48] disabled:opacity-60" disabled={!budgetInfoSubmitted || hasExecutionBudget || Boolean(selectedProjectBudget)} onClick={() => setLineModalOpen(true)}>
                Ajouter une ligne
              </button>
            </div>
            {!budgetInfoSubmitted ? <p className="mt-3 text-sm font-semibold text-[#D97706]">Validez d'abord les informations budgetaires pour ajouter des lignes.</p> : null}
          </section>

          {categoriesQuery.isError ? <ErrorMessage message={getApiErrorMessage(categoriesQuery.error)} /> : null}
          <BudgetLinesTable lines={lines} onRemove={(index) => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
          <BudgetSummaryCard lines={lines} />
          {lines.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-3 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <button
                className="rounded-md border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#F4F7FA] disabled:opacity-60"
                disabled={saveBudgetDraftWithLines.isPending || createBudgetWithLines.isPending || !activeExercice || !budgetInfoSubmitted || hasExecutionBudget || Boolean(selectedProjectBudget)}
                onClick={saveDraft}
              >
                {saveBudgetDraftWithLines.isPending ? "Enregistrement..." : "Enregistrer en brouillon"}
              </button>
              <button
                className="btn-primary rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#166F48] disabled:opacity-60"
                disabled={createBudgetWithLines.isPending || saveBudgetDraftWithLines.isPending || !activeExercice || !budgetInfoSubmitted || hasExecutionBudget || Boolean(selectedProjectBudget)}
                onClick={() => setConfirmOpen(true)}
              >
                {createBudgetWithLines.isPending ? "Envoi en cours..." : "Soumettre au Gestionnaire"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-30 grid gap-3 border-t border-[#0F3D5E] bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur-sm md:grid-cols-3 lg:left-72">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Exercice budgetaire</p>
          <p className="mt-1 font-bold text-[#0F3D5E]">{activeExerciceQuery.isLoading ? "Chargement..." : activeExercice?.libelle ?? "Aucun exercice ouvert"}</p>
          {footerBudget ? <p className="mt-1 text-xs font-semibold text-[#6B7280]">{budgetLabels[footerBudget.statut]}</p> : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget previsionnel</p>
          <p className="mt-1 font-bold text-[#0F3D5E]">{formatAmount(budgetPrevisionnel)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget realise</p>
          <p className="mt-1 font-bold text-[#0F3D5E]">{formatAmount(budgetRealise)}</p>
        </div>
      </footer>

      <PopupModal maxWidth="max-w-5xl" open={budgetModalOpen} title="Renseigner les informations budgetaires" onClose={() => setBudgetModalOpen(false)}>
        <div className="grid gap-4">
          <section className="grid gap-4 border border-[#E5E7EB] bg-white p-5 text-left md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]" htmlFor="project-select-modal">
                Projet
              </label>
              <select
                id="project-select-modal"
                className="mt-2 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#1F2937] focus:border-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#BBF7D0]"
                disabled={projectsQuery.isLoading}
                value={selectedProjectId}
                onChange={(event) => {
                  const projectId = event.target.value ? Number(event.target.value) : "";
                  const project = projectsQuery.data?.find((item) => item.id === projectId);
                  setSelectedProjectId(projectId);
                  setBudgetInfoSubmitted(false);
                  setLines([]);
                  setBudgetDates({
                    date_debut: project?.date_debut_prevue ?? "",
                    date_fin: project?.date_fin_prevue ?? "",
                  });
                }}
              >
                <option value="">{projectsQuery.isLoading ? "Chargement..." : "Choisir le projet"}</option>
                {(projectsQuery.data ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.titre}
                  </option>
                ))}
              </select>
              {projectsQuery.data?.length === 0 ? <p className="mt-2 text-xs font-medium text-[#D97706]">Aucun projet ne vous est affecte.</p> : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Exercice ouvert</p>
              <p className="mt-2 text-lg font-bold text-[#1F2937]">{activeExerciceQuery.isLoading ? "Chargement..." : activeExercice?.libelle ?? "Aucun exercice ouvert"}</p>
            </div>
            {selectedProject ? (
              <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Departement</p>
                  <p className="mt-2 text-sm font-semibold text-[#1F2937]">{selectedProject.departement?.nom ?? currentUser?.departement?.nom ?? "Departement non renseigne"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Periode du projet</p>
                  <p className="mt-2 text-sm font-semibold text-[#1F2937]">{selectedProject.date_debut_prevue ?? "-"} au {selectedProject.date_fin_prevue ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget existant</p>
                  <p className="mt-2 text-sm font-semibold text-[#1F2937]">{selectedProjectBudget ? budgetLabels[selectedProjectBudget.statut] : "Aucun"}</p>
                  {hasExecutionBudget ? <p className="mt-1 text-xs font-semibold text-[#DC2626]">Creation bloquee</p> : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 border border-[#E5E7EB] bg-white p-5 text-left md:grid-cols-2">
            <label className="text-sm font-medium text-[#374151]">
              Date du debut
              <input
                className="mt-1 w-full btn-secondary rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                max={selectedProject?.date_fin_prevue ?? undefined}
                min={selectedProject?.date_debut_prevue ?? undefined}
                type="date"
                value={effectiveBudgetDates.date_debut}
                onChange={(event) => {
                  setBudgetInfoSubmitted(false);
                  setBudgetDates((current) => ({ ...current, date_debut: event.target.value }));
                }}
              />
            </label>
            <label className="text-sm font-medium text-[#374151]">
              Date de fin
              <input
                className="mt-1 w-full btn-secondary rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                max={selectedProject?.date_fin_prevue ?? undefined}
                min={effectiveBudgetDates.date_debut || selectedProject?.date_debut_prevue || undefined}
                type="date"
                value={effectiveBudgetDates.date_fin}
                onChange={(event) => {
                  setBudgetInfoSubmitted(false);
                  setBudgetDates((current) => ({ ...current, date_fin: event.target.value }));
                }}
              />
            </label>
          </section>

          <BudgetForm
            value={budgetForm}
            onChange={(value) => {
              setBudgetInfoSubmitted(false);
              setBudgetForm(value);
            }}
          />

          <div className="flex justify-end">
            <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2D46]" onClick={validateBudgetInfo}>
              Soumettre les informations
            </button>
          </div>
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
