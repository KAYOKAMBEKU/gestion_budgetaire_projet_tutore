import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { CurrencySelector } from "../../../components/ui/CurrencySelector";
import { PopupModal } from "../../../components/ui/PopupModal";
import { useCurrency } from "../../../context/CurrencyContext";
import { useAppDispatch } from "../../../store";
import { showToast } from "../../../store/slices/uiSlice";
import { useAuth } from "../../../context/AuthContext";
import type {
  MouvementFinancierCreate,
  TypeMouvementFinancier,
} from "../../../types/mouvementFinancier";
import { formatDate } from "../../../utils/formatDate";
import { Toast } from "../../administration/components/Toast";
import {
  getBudgetCurrency,
  getExecutionCurrency,
} from "../../manager/utils/budgetCurrency";
import { ComptableSidebar } from "../components/ComptableSidebar";
import {
  useBudgetExecutionContext,
  useCreateMouvementFinancier,
} from "../hooks/useComptableBudget";
import { formatAmount } from "../../manager/utils/formatAmount";

const emptyForm = {
  type_mouvement: "entree" as TypeMouvementFinancier,
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

export function ComptableBudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  useCurrency();
  const budgetId = id ? Number(id) : undefined;
  const dispatch = useAppDispatch();
  const { authLoading, isAuthenticated, isComptable } = useAuth();
  const contextQuery = useBudgetExecutionContext(budgetId);
  const createMouvement = useCreateMouvementFinancier();
  const [formOpen, setFormOpen] = useState<false | TypeMouvementFinancier>(
    false,
  );
  const [form, setForm] = useState(emptyForm);

  const budget = contextQuery.data?.budget;
  const lignes = useMemo(
    () => contextQuery.data?.lignes ?? [],
    [contextQuery.data?.lignes],
  );
  const execution = contextQuery.data?.execution;
  const depenseLines = useMemo(
    () => lignes.filter((ligne) => ligne.type_ligne === "depense"),
    [lignes],
  );
  const recetteLines = useMemo(
    () => lignes.filter((ligne) => ligne.type_ligne === "recette"),
    [lignes],
  );
  const canRecord = budget?.statut === "en_execution";

  function openForm(type: TypeMouvementFinancier) {
    setForm({
      ...emptyForm,
      type_mouvement: type,
      date_mouvement: new Date().toISOString().slice(0, 10),
    });
    setFormOpen(type);
  }

  function updateForm<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateMovement() {
    if (!budget?.projet_id || !budget.id) {
      return "Budget ou projet introuvable.";
    }
    if (!canRecord) {
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
    const projectStart = budget.projet?.date_debut_prevue;
    const projectEnd = budget.projet?.date_fin_prevue;
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
    if (!budget?.projet_id || !budget.id) {
      return;
    }
    const descriptionParts = [
      form.beneficiaire ? `Beneficiaire: ${form.beneficiaire}` : "",
      form.description,
    ].filter(Boolean);
    const payload: MouvementFinancierCreate = {
      projet_id: budget.projet_id,
      budget_id: budget.id,
      ligne_budgetaire_id: Number(form.ligne_budgetaire_id),
      type_mouvement: form.type_mouvement,
      libelle: form.libelle,
      categorie: form.categorie || undefined,
      description: descriptionParts.join("\n") || undefined,
      montant: Number(form.montant),
      date_mouvement: form.date_mouvement,
      mode_paiement: form.mode_paiement || undefined,
      // reference_paiement is generated server-side; do not send from client
      piece_justificative: form.piece_justificative || undefined,
    };

    createMouvement.mutate(payload, {
      onSuccess: () => {
        setFormOpen(false);
        dispatch(
          showToast({
            message: "Mouvement financier enregistre.",
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
  if (contextQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">
        Chargement du budget...
      </main>
    );
  }
  if (contextQuery.isError || !budget) {
    return (
      <AccessMessage
        message={
          contextQuery.isError
            ? getApiErrorMessage(contextQuery.error)
            : "Budget introuvable."
        }
        title="Erreur"
      />
    );
  }

  const mouvements = execution?.mouvements_financiers ?? [];
  const currency = execution
    ? getExecutionCurrency(execution)
    : getBudgetCurrency(budget);

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ComptableSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <Link
            className="text-sm font-semibold text-[#15803D] hover:text-[#166F48]"
            to="/comptable/budgets"
          >
            Retour aux budgets
          </Link>

          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">
                  Execution budgetaire
                </p>
                <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">
                  {budget.libelle}
                </h1>
                <p className="mt-2 text-sm text-[#6B7280]">
                  {budget.reference} -{" "}
                  {budget.projet?.titre ?? budget.projet_id}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${canRecord ? "bg-[#DBEAFE] text-[#2563EB] ring-blue-200" : "bg-[#FEF3C7] text-[#D97706] ring-[#FDE68A]"}`}
              >
                {canRecord ? "En execution" : "Approuve - attente execution"}
              </span>
            </div>
          </header>

          {!canRecord ? (
            <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-sm font-medium text-[#92400E]">
              Ce budget est approuve mais pas encore en execution. Le Comptable
              ne peut pas enregistrer de mouvements.
            </div>
          ) : null}

          <section className="grid gap-4 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] md:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold text-[#1F2937]">
                Budget previsionnel
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Recettes prevues
                  </p>
                  <p className="mt-2 font-bold text-[#1F2937]">
                    {formatAmount(
                      execution?.total_recettes_prevues ?? 0,
                      currency,
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Depenses prevues
                  </p>
                  <p className="mt-2 font-bold text-[#1F2937]">
                    {formatAmount(
                      execution?.total_depenses_prevues ??
                        budget.montant_total_prevu ??
                        0,
                      currency,
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB] sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Solde previsionnel
                  </p>
                  <p className="mt-2 font-bold text-[#1F2937]">
                    {formatAmount(execution?.solde_previsionnel ?? 0, currency)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1F2937]">
                Budget realise
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Recettes encaissees
                  </p>
                  <p className="mt-2 font-bold text-[#1F2937]">
                    {formatAmount(
                      execution?.total_recettes_realisees ?? 0,
                      currency,
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Depenses payees
                  </p>
                  <p className="mt-2 font-bold text-[#1F2937]">
                    {formatAmount(
                      execution?.total_depenses_realisees ?? 0,
                      currency,
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB] sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Solde realise
                  </p>
                  <p className="mt-2 font-bold text-[#1F2937]">
                    {formatAmount(execution?.solde_realise ?? 0, currency)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Ecart recettes
              </p>
              <p className="mt-2 text-lg font-bold text-[#1F2937]">
                {formatAmount(execution?.ecart_recettes ?? 0, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Ecart depenses
              </p>
              <p className="mt-2 text-lg font-bold text-[#1F2937]">
                {formatAmount(execution?.ecart_depenses ?? 0, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Taux execution depenses
              </p>
              <p className="mt-2 text-lg font-bold text-[#1F2937]">
                {Number(execution?.taux_execution_depenses ?? 0).toFixed(2)}%
              </p>
            </div>
          </section>

          <section className="flex flex-wrap justify-end gap-3 rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#E5E7EB]">
            <button
              className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#166F48] disabled:opacity-60"
              disabled={!canRecord}
              onClick={() => openForm("entree")}
            >
              Enregistrer une entree
            </button>
            <button
              className="btn-danger rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-60"
              disabled={!canRecord}
              onClick={() => openForm("sortie")}
            >
              Enregistrer une sortie
            </button>
          </section>

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <h2 className="text-lg font-bold text-[#1F2937]">
              Lignes budgetaires prevues
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Ligne
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Prevu
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Realise
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Ecart
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne) => {
                    const executionLine = execution?.lignes_budgetaires.find(
                      (item) => item.ligne_budgetaire_id === ligne.id,
                    );
                    return (
                      <tr key={ligne.id} className="border-b border-[#E5E7EB]">
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">
                          {ligne.libelle}
                        </td>
                        <td className="px-4 py-3 capitalize text-[#6B7280]">
                          {ligne.type_ligne}
                        </td>
                        <td className="px-4 py-3">
                          {formatAmount(ligne.montant_prevu, currency)}
                        </td>
                        <td className="px-4 py-3">
                          {formatAmount(
                            executionLine?.montant_realise ??
                              ligne.montant_realise ??
                              0,
                            currency,
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {formatAmount(
                            executionLine?.ecart_montant ??
                              ligne.ecart_montant ??
                              0,
                            currency,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <h2 className="text-lg font-bold text-[#1F2937]">
              Mouvements financiers
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Date
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Libelle
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Reference
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mouvements.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-8 text-center text-[#6B7280]"
                        colSpan={5}
                      >
                        Aucun mouvement enregistre.
                      </td>
                    </tr>
                  ) : (
                    mouvements.map((mouvement) => (
                      <tr
                        key={mouvement.id}
                        className="border-b border-[#E5E7EB]"
                      >
                        <td className="px-4 py-3 text-[#6B7280]">
                          {formatDate(mouvement.date_mouvement)}
                        </td>
                        <td className="px-4 py-3 capitalize text-[#6B7280]">
                          {mouvement.type_mouvement}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">
                          {mouvement.libelle}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {mouvement.reference_paiement ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">
                          {formatAmount(mouvement.montant, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <PopupModal
        open={Boolean(formOpen)}
        title={
          formOpen === "sortie"
            ? "Enregistrer une sortie"
            : "Enregistrer une entree"
        }
        onClose={() => setFormOpen(false)}
      >
        <div className="grid gap-4 text-left">
          <CurrencySelector variant="modal" />
          <div className="rounded-md bg-[#F9FAFB] px-3 py-2 text-sm text-[#6B7280]">
            Projet:{" "}
            <span className="font-semibold text-[#1F2937]">
              {budget.projet?.titre ?? budget.projet_id}
            </span>{" "}
            - Budget:{" "}
            <span className="font-semibold text-[#1F2937]">
              {budget.reference}
            </span>
          </div>
          {
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Ligne budgetaire concernee
              <select
                className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
                value={form.ligne_budgetaire_id}
                onChange={(event) =>
                  updateForm("ligne_budgetaire_id", event.target.value)
                }
              >
                <option value="">
                  {form.type_mouvement === "sortie"
                    ? "Choisir une ligne de depense"
                    : "Choisir une ligne de recette"}
                </option>
                {(form.type_mouvement === "sortie"
                  ? depenseLines
                  : recetteLines
                ).map((ligne) => (
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
                className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
                value={form.libelle}
                onChange={(event) => updateForm("libelle", event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Categorie
              <input
                className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
                value={form.categorie}
                onChange={(event) =>
                  updateForm("categorie", event.target.value)
                }
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Montant
              <input
                className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
                min="0.01"
                step="0.01"
                type="number"
                value={form.montant}
                onChange={(event) => updateForm("montant", event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Date
              <input
                className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
                max={budget.projet?.date_fin_prevue ?? undefined}
                min={budget.projet?.date_debut_prevue ?? undefined}
                type="date"
                value={form.date_mouvement}
                onChange={(event) =>
                  updateForm("date_mouvement", event.target.value)
                }
              />
            </label>
            {formOpen === "sortie" ? (
              <label className="grid gap-1 text-sm font-semibold text-[#374151]">
                Beneficiaire
                <input
                  className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
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
                className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
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
                className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
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
              className="min-h-24 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal"
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#374151]"
              onClick={() => setFormOpen(false)}
            >
              Annuler
            </button>
            <button
              className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={createMouvement.isPending}
              onClick={submitMovement}
            >
              {createMouvement.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </PopupModal>
      <Toast />
    </main>
  );
}
