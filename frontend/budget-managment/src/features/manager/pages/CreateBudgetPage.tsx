import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { PopupModal } from "../../../components/ui/PopupModal";
import { useAuth } from "../../../context/AuthContext";
import { useAppDispatch } from "../../../store";
import { showToast } from "../../../store/slices/uiSlice";
import type { BudgetCreate } from "../../../types/budget";
import type { DraftBudgetLine } from "../../../types/ligneBudgetaire";
import { BudgetForm } from "../components/BudgetForm";
import { BudgetLineForm } from "../components/BudgetLineForm";
import { BudgetLinesTable } from "../components/BudgetLinesTable";
import { BudgetSummaryCard } from "../components/BudgetSummaryCard";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { ManagerBudgetsStatus } from "../components/ManagerBudgetsStatus";
import { SubmitBudgetConfirmModal } from "../components/SubmitBudgetConfirmModal";
import { Toast } from "../../administration/components/Toast";
import { useActiveExercice, useCategoriesBudgetaires, useCreateBudgetWithLines, useManagerBudgets, useManagerDepartement } from "../hooks/useManagerBudget";

function BlockingMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-800">{message}</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700">{message}</div>;
}

export function CreateBudgetPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { authLoading, currentUser, isAuthenticated, isManager, isBudgetManager } = useAuth();
  const [budgetForm, setBudgetForm] = useState<Pick<BudgetCreate, "reference" | "libelle" | "description">>({
    reference: "",
    libelle: "",
    description: "",
  });
  const [lines, setLines] = useState<DraftBudgetLine[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);

  const departementId = currentUser?.departement_id;
  const departementQuery = useManagerDepartement(departementId);
  const activeExerciceQuery = useActiveExercice();
  const categoriesQuery = useCategoriesBudgetaires();
  const managerBudgetsQuery = useManagerBudgets(departementId);
  const createBudgetWithLines = useCreateBudgetWithLines();

  const departementName = departementQuery.data?.nom ?? currentUser?.departement?.nom ?? "Departement non renseigne";
  const activeExercice = activeExerciceQuery.data;

  const statusBadge = useMemo(() => {
    if (!successMessage) {
      return null;
    }
    return <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">En attente de validation</span>;
  }, [successMessage]);

  function submitBudget() {
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
    if (!currentUser || !departementId || !activeExercice) {
      dispatch(showToast({ message: "Le departement ou l'exercice ouvert est introuvable.", type: "error" }));
      setConfirmOpen(false);
      return;
    }

    createBudgetWithLines.mutate(
      {
        reference: budgetForm.reference,
        libelle: budgetForm.libelle,
        description: budgetForm.description || undefined,
        departement_id: departementId,
        exercice_id: activeExercice.id,
        created_by_id: currentUser.id,
        statut: "brouillon",
        lignes: lines,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setSuccessMessage("Budget soumis avec succes. Il est maintenant en attente de validation.");
          dispatch(showToast({ message: "Budget soumis avec succes. Il est maintenant en attente de validation.", type: "success" }));
          setLines([]);
          setBudgetForm({ reference: "", libelle: "", description: "" });
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

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
            <button className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-950" onClick={() => navigate("/manager")}>
              Retour
            </button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Creation du budget</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Creation d'un budget</h1>
                <p className="mt-2 text-sm text-slate-600">Creez un budget en brouillon, ajoutez ses lignes, puis soumettez-le pour validation.</p>
              </div>
              {statusBadge}
            </div>
          </header>

          {!isAuthenticated ? <ErrorMessage message="Vous devez etre connecte pour acceder a cette page." /> : null}
          {isAuthenticated && !isBudgetManager ? <ErrorMessage message="Acces refuse. Cette page est reservee au gestionnaire budgetaire." /> : null}
          {isBudgetManager && !departementId ? <BlockingMessage message="Aucun departement n'est associe a votre compte. Contactez l'administrateur." /> : null}
          {activeExerciceQuery.isError ? <BlockingMessage message="Aucun exercice budgetaire ouvert. Contactez l'administrateur." /> : null}

          <section className="grid gap-4 rounded-lg bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Departement</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{departementQuery.isLoading ? "Chargement..." : departementName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exercice ouvert</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{activeExerciceQuery.isLoading ? "Chargement..." : activeExercice?.libelle ?? "Aucun exercice ouvert"}</p>
            </div>
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
                disabled={createBudgetWithLines.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                {createBudgetWithLines.isPending ? "Envoi en cours..." : "Soumettre pour validation"}
              </button>
            </div>
          ) : null}
          <ManagerBudgetsStatus budgets={managerBudgetsQuery.data ?? []} loading={managerBudgetsQuery.isLoading} />
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
