import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { useAppDispatch } from "../../../store";
import { showToast } from "../../../store/slices/uiSlice";
import type { Budget } from "../../../types/budget";
import type {
  MouvementFinancierCreate,
  TypeMouvementFinancier,
} from "../../../types/mouvementFinancier";
import { Toast } from "../../administration/components/Toast";
import {
  getBudgetCurrency,
  getExecutionCurrency,
} from "../../manager/utils/budgetCurrency";
import { formatAmount } from "../../manager/utils/formatAmount";
import { ComptableSidebar } from "../components/ComptableSidebar";
import {
  useBudgetExecutionContext,
  useCreateMouvementFinancier,
  useExecutableBudgets,
} from "../hooks/useComptableBudget";

const emptyForm = {
  budget_id: "",
  ligne_budgetaire_id: "",
  libelle: "",
  categorie: "",
  description: "",
  beneficiaire: "",
  montant: "",
  date_mouvement: "",
  mode_paiement: "",
  piece_justificative: "",
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

function getProjectPeriod(budget?: Budget) {
  const start = budget?.projet?.date_debut_prevue;
  const end = budget?.projet?.date_fin_prevue;
  if (!start && !end) {
    return "-";
  }
  return `${start ?? "-"} au ${end ?? "-"}`;
}

export function ComptableMovementPage({
  type,
}: {
  type: TypeMouvementFinancier;
}) {
  const dispatch = useAppDispatch();
  const { authLoading, isAuthenticated, isComptable } = useAuth();
  const budgetsQuery = useExecutableBudgets();
  const createMouvement = useCreateMouvementFinancier();
  const [form, setForm] = useState({
    ...emptyForm,
    date_mouvement: new Date().toISOString().slice(0, 10),
  });

  const executableBudgets = useMemo(
    () =>
      (budgetsQuery.data ?? []).filter(
        (budget) => budget.statut === "en_execution",
      ),
    [budgetsQuery.data],
  );
  const selectedBudgetId = form.budget_id ? Number(form.budget_id) : undefined;
  const contextQuery = useBudgetExecutionContext(selectedBudgetId);
  const selectedBudget =
    contextQuery.data?.budget ??
    executableBudgets.find((budget) => budget.id === selectedBudgetId);
  const lignes = useMemo(
    () => contextQuery.data?.lignes ?? [],
    [contextQuery.data?.lignes],
  );
  const depenseLines = useMemo(
    () => lignes.filter((ligne) => ligne.type_ligne === "depense"),
    [lignes],
  );
  const recetteLines = useMemo(
    () => lignes.filter((ligne) => ligne.type_ligne === "recette"),
    [lignes],
  );
  const execution = contextQuery.data?.execution;
  const isSortie = type === "sortie";
  const currency = execution
    ? getExecutionCurrency(execution)
    : getBudgetCurrency(selectedBudget);

  function updateForm<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm(keepBudget = true) {
    setForm((current) => ({
      ...emptyForm,
      budget_id: keepBudget ? current.budget_id : "",
      date_mouvement: new Date().toISOString().slice(0, 10),
    }));
  }

  function validateMovement() {
    if (!selectedBudget?.id || !selectedBudget.projet_id) {
      return "Veuillez choisir un budget en execution.";
    }
    if (selectedBudget.statut !== "en_execution") {
      return "Le budget doit etre en execution pour enregistrer un mouvement.";
    }
    if (!form.libelle.trim()) {
      return "Veuillez renseigner le libelle.";
    }
    if (!form.date_mouvement) {
      return "Veuillez renseigner la date du mouvement.";
    }
    const amount = Number(form.montant);
    if (!amount || amount <= 0) {
      return "Le montant doit etre superieur a 0.";
    }
    if (!form.ligne_budgetaire_id) {
      return "Veuillez choisir la ligne budgetaire concernee par le mouvement financier.";
    }
    const projectStart = selectedBudget.projet?.date_debut_prevue;
    const projectEnd = selectedBudget.projet?.date_fin_prevue;
    if (projectStart && form.date_mouvement < projectStart) {
      return "La date du mouvement est avant le debut du projet.";
    }
    if (projectEnd && form.date_mouvement > projectEnd) {
      return "La date du mouvement depasse la fin du projet.";
    }
    return null;
  }

  function submitMovement() {
    const error = validateMovement();
    if (error) {
      dispatch(showToast({ message: error, type: "error" }));
      return;
    }
    if (!selectedBudget?.id || !selectedBudget.projet_id) {
      return;
    }

    const descriptionParts = [
      isSortie && form.beneficiaire ? `Beneficiaire: ${form.beneficiaire}` : "",
      form.description,
    ].filter(Boolean);
    const payload: MouvementFinancierCreate = {
      projet_id: selectedBudget.projet_id,
      budget_id: selectedBudget.id,
      ligne_budgetaire_id: Number(form.ligne_budgetaire_id),
      type_mouvement: type,
      libelle: form.libelle,
      categorie: form.categorie || undefined,
      description: descriptionParts.join("\n") || undefined,
      montant: Number(form.montant),
      date_mouvement: form.date_mouvement,
      mode_paiement: (form.mode_paiement || undefined) as
        | "Cash"
        | "Mobile Money"
        | "Banque"
        | undefined,
      // reference_paiement is generated server-side; do not send from client
      piece_justificative: form.piece_justificative || undefined,
    };

    createMouvement.mutate(payload, {
      onSuccess: () => {
        resetForm();
        dispatch(
          showToast({
            message: isSortie
              ? "Sortie financiere enregistree."
              : "Entree financiere enregistree.",
            type: "success",
          }),
        );
      },
      onError: (mutationError) =>
        dispatch(
          showToast({
            message: getApiErrorMessage(mutationError),
            type: "error",
          }),
        ),
    });
  }

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">
        Verification de la session...
      </main>
    );
  }
  if (!isAuthenticated) {
    return (
      <AccessMessage
        message="Vous devez etre connecte pour acceder a cette page."
        title="Connexion requise"
      />
    );
  }
  if (!isComptable) {
    return (
      <AccessMessage
        message="Acces refuse. Cette page est reservee au Comptable."
        title="Acces refuse"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ComptableSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2563EB]">
              Mouvements financiers
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">
              {isSortie ? "Sorties financieres" : "Entrees financieres"}
            </h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              {isSortie
                ? "Enregistrez les depenses reelles et rattachez-les aux lignes budgetaires prevues."
                : "Enregistrez les montants reellement encaisses pour un projet en execution."}
            </p>
          </header>

          {budgetsQuery.isError ? (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">
              {getApiErrorMessage(budgetsQuery.error)}
            </div>
          ) : null}
          {executableBudgets.length === 0 && !budgetsQuery.isLoading ? (
            <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-sm font-medium text-[#92400E]">
              Aucun budget en execution. Un budget approuve doit d'abord etre
              demarre par l'Administrateur.
            </div>
          ) : null}

          <section className="grid gap-6 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                Budget en execution
                <select
                  className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                  disabled={budgetsQuery.isLoading}
                  value={form.budget_id}
                  onChange={(event) => {
                    updateForm("budget_id", event.target.value);
                    updateForm("ligne_budgetaire_id", "");
                  }}
                >
                  <option value="">
                    {budgetsQuery.isLoading
                      ? "Chargement..."
                      : "Choisir un budget"}
                  </option>
                  {executableBudgets.map((budget) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.projet?.titre ?? `Projet ${budget.projet_id}`} -{" "}
                      {budget.reference}
                    </option>
                  ))}
                </select>
              </label>

              {selectedBudget ? (
                <div className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Projet
                    </p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {selectedBudget.projet?.titre ?? selectedBudget.projet_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Departement
                    </p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {selectedBudget.projet?.departement?.nom ??
                        selectedBudget.departement_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Periode projet
                    </p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {getProjectPeriod(selectedBudget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Budget previsionnel
                    </p>
                    <p className="mt-1 font-semibold text-[#1F2937]">
                      {formatAmount(
                        selectedBudget.montant_total_prevu ?? 0,
                        currency,
                      )}
                    </p>
                  </div>
                </div>
              ) : null}

              {
                <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                  Ligne budgetaire concernee
                  <select
                    className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                    disabled={!selectedBudgetId || contextQuery.isLoading}
                    value={form.ligne_budgetaire_id}
                    onChange={(event) =>
                      updateForm("ligne_budgetaire_id", event.target.value)
                    }
                  >
                    <option value="">
                      {contextQuery.isLoading
                        ? "Chargement des lignes..."
                        : isSortie
                          ? "Choisir une ligne de depense"
                          : "Choisir une ligne de recette"}
                    </option>
                    {(isSortie ? depenseLines : recetteLines).map((ligne) => (
                      <option key={ligne.id} value={ligne.id}>
                        {ligne.libelle} -{" "}
                        {formatAmount(ligne.montant_prevu, currency)}
                      </option>
                    ))}
                  </select>
                </label>
              }

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                  Libelle
                  <input
                    className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                    value={form.libelle}
                    onChange={(event) =>
                      updateForm("libelle", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                  Categorie
                  <input
                    className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                    value={form.categorie}
                    onChange={(event) =>
                      updateForm("categorie", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                  Montant
                  <input
                    className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={form.montant}
                    onChange={(event) =>
                      updateForm("montant", event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                  Date
                  <input
                    className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                    max={selectedBudget?.projet?.date_fin_prevue ?? undefined}
                    min={selectedBudget?.projet?.date_debut_prevue ?? undefined}
                    type="date"
                    value={form.date_mouvement}
                    onChange={(event) =>
                      updateForm("date_mouvement", event.target.value)
                    }
                  />
                </label>
                {isSortie ? (
                  <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                    Beneficiaire
                    <input
                      className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                      value={form.beneficiaire}
                      onChange={(event) =>
                        updateForm("beneficiaire", event.target.value)
                      }
                    />
                  </label>
                ) : null}
                <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                  Mode de paiement
                  <select
                    className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                    value={form.mode_paiement}
                    onChange={(event) =>
                      updateForm("mode_paiement", event.target.value)
                    }
                  >
                    <option value="">Choisir un mode de paiement</option>
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Banque">Banque</option>
                  </select>
                </label>
                {/* Reference removed: generated automatically by server */}
                <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                  Piece justificative
                  <input
                    className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                    value={form.piece_justificative}
                    onChange={(event) =>
                      updateForm("piece_justificative", event.target.value)
                    }
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                Description
                <textarea
                  className="min-h-24 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                />
              </label>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#F4F7FA]"
                  type="button"
                  onClick={() => resetForm(false)}
                >
                  Reinitialiser
                </button>
                <button
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${isSortie ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#1F8A5B] hover:bg-[#166F48]"}`}
                  disabled={createMouvement.isPending || !selectedBudgetId}
                  type="button"
                  onClick={submitMovement}
                >
                  {createMouvement.isPending
                    ? "Enregistrement..."
                    : isSortie
                      ? "Enregistrer la sortie"
                      : "Enregistrer l'entree"}
                </button>
              </div>
            </div>

            <aside className="h-fit rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <h2 className="text-base font-bold text-[#1F2937]">
                Synthese du budget
              </h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7280]">Recettes realisees</span>
                  <span className="font-bold text-[#15803D]">
                    {formatAmount(
                      execution?.total_recettes_realisees ?? 0,
                      currency,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7280]">Depenses realisees</span>
                  <span className="font-bold text-[#DC2626]">
                    {formatAmount(
                      execution?.total_depenses_realisees ?? 0,
                      currency,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
                  <span className="font-semibold text-[#374151]">
                    Solde realise
                  </span>
                  <span className="font-bold text-[#1F2937]">
                    {formatAmount(execution?.solde_realise ?? 0, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7280]">Ecart depenses</span>
                  <span className="font-bold text-[#1F2937]">
                    {formatAmount(execution?.ecart_depenses ?? 0, currency)}
                  </span>
                </div>
              </div>
              {selectedBudgetId ? (
                <Link
                  className="mt-5 inline-flex text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                  to={`/comptable/budgets/${selectedBudgetId}`}
                >
                  Voir le detail d'execution
                </Link>
              ) : null}
            </aside>
          </section>
        </div>
      </div>
      <Toast />
    </main>
  );
}
