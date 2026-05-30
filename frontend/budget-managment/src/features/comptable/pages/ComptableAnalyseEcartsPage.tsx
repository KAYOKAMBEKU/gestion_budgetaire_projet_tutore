import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import type { Budget } from "../../../types/budget";
import { formatAmount } from "../../manager/utils/formatAmount";
import { ComptableSidebar } from "../components/ComptableSidebar";
import { useBudgetExecutionContext, useExecutableBudgets } from "../hooks/useComptableBudget";

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

function getBudgetLabel(budget: Budget) {
  return `${budget.projet?.titre ?? `Projet ${budget.projet_id ?? budget.id}`} - ${budget.reference}`;
}

function getEcartTone(amount: number) {
  if (amount > 0) {
    return "text-[#DC2626]";
  }
  if (amount < 0) {
    return "text-[#15803D]";
  }
  return "text-[#1F2937]";
}

function getRateTone(rate: number) {
  if (rate >= 100) {
    return "bg-[#FEE2E2] text-[#DC2626]";
  }
  if (rate >= 75) {
    return "bg-[#FEF3C7] text-[#D97706]";
  }
  return "bg-[#DCFCE7] text-[#15803D]";
}

export function ComptableAnalyseEcartsPage() {
  const { authLoading, isAuthenticated, isComptable } = useAuth();
  const budgetsQuery = useExecutableBudgets();
  const [selectedBudgetId, setSelectedBudgetId] = useState("");

  const executableBudgets = useMemo(() => (budgetsQuery.data ?? []).filter((budget) => budget.statut === "en_execution"), [budgetsQuery.data]);
  const activeBudgetId = selectedBudgetId ? Number(selectedBudgetId) : executableBudgets[0]?.id;
  const contextQuery = useBudgetExecutionContext(activeBudgetId);
  const budget = contextQuery.data?.budget ?? executableBudgets.find((item) => item.id === activeBudgetId);
  const execution = contextQuery.data?.execution;
  const lignes = execution?.lignes_budgetaires ?? [];

  const resultatPrevisionnel = (execution?.total_recettes_prevues ?? 0) - (execution?.total_depenses_prevues ?? 0);
  const resultatRealise = (execution?.total_recettes_realisees ?? 0) - (execution?.total_depenses_realisees ?? 0);
  const ecartResultat = execution?.ecart_resultat ?? resultatRealise - resultatPrevisionnel;

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isComptable) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Comptable." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ComptableSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2563EB]">Controle budgetaire</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Analyse des ecarts</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Comparez le budget previsionnel aux realisations calculees depuis les mouvements financiers.</p>
          </header>

          {budgetsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(budgetsQuery.error)}</div> : null}
          {contextQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(contextQuery.error)}</div> : null}

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="grid max-w-2xl flex-1 gap-1 text-sm font-semibold text-[#374151]">
                Budget en execution
                <select
                  className="rounded-md border border-[#E5E7EB] px-3 py-2 font-normal text-[#1F2937]"
                  disabled={budgetsQuery.isLoading || executableBudgets.length === 0}
                  value={activeBudgetId ?? ""}
                  onChange={(event) => setSelectedBudgetId(event.target.value)}
                >
                  {budgetsQuery.isLoading ? <option value="">Chargement...</option> : null}
                  {!budgetsQuery.isLoading && executableBudgets.length === 0 ? <option value="">Aucun budget en execution</option> : null}
                  {executableBudgets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {getBudgetLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              {activeBudgetId ? (
                <Link className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#F4F7FA]" to={`/comptable/budgets/${activeBudgetId}`}>
                  Detail d'execution
                </Link>
              ) : null}
            </div>
          </section>

          {executableBudgets.length === 0 && !budgetsQuery.isLoading ? (
            <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-sm font-medium text-[#92400E]">
              Aucun budget en execution. Les ecarts seront disponibles apres le demarrage de l'execution.
            </div>
          ) : null}

          {budget ? (
            <>
              <section className="grid gap-4 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] lg:grid-cols-3">
                <div className="rounded-lg bg-[#F9FAFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Ecart recettes</p>
                  <p className={`mt-2 text-xl font-bold ${getEcartTone(execution?.ecart_recettes ?? 0)}`}>{formatAmount(execution?.ecart_recettes ?? 0)}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">Realise - prevu</p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Ecart depenses</p>
                  <p className={`mt-2 text-xl font-bold ${getEcartTone(execution?.ecart_depenses ?? 0)}`}>{formatAmount(execution?.ecart_depenses ?? 0)}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">Depenses realisees - depenses prevues</p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Ecart resultat</p>
                  <p className={`mt-2 text-xl font-bold ${getEcartTone(ecartResultat)}`}>{formatAmount(ecartResultat)}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">Resultat realise - resultat previsionnel</p>
                </div>
              </section>

              <section className="grid gap-4 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Recettes prevues</p>
                  <p className="mt-1 font-bold text-[#1F2937]">{formatAmount(execution?.total_recettes_prevues ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Recettes realisees</p>
                  <p className="mt-1 font-bold text-[#15803D]">{formatAmount(execution?.total_recettes_realisees ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Depenses prevues</p>
                  <p className="mt-1 font-bold text-[#1F2937]">{formatAmount(execution?.total_depenses_prevues ?? budget.montant_total_prevu ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Depenses realisees</p>
                  <p className="mt-1 font-bold text-[#DC2626]">{formatAmount(execution?.total_depenses_realisees ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Solde previsionnel</p>
                  <p className="mt-1 font-bold text-[#1F2937]">{formatAmount(execution?.solde_previsionnel ?? resultatPrevisionnel)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Solde realise</p>
                  <p className="mt-1 font-bold text-[#1F2937]">{formatAmount(execution?.solde_realise ?? resultatRealise)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Taux depenses</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-sm font-bold ${getRateTone(execution?.taux_execution_depenses ?? 0)}`}>
                    {Number(execution?.taux_execution_depenses ?? 0).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Taux recettes</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-sm font-bold ${getRateTone(execution?.taux_execution_recettes ?? 0)}`}>
                    {Number(execution?.taux_execution_recettes ?? 0).toFixed(2)}%
                  </span>
                </div>
              </section>

              <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-[#1F2937]">Ecarts par ligne budgetaire</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">Une sortie rattachee a une ligne augmente son montant realise.</p>
                  </div>
                  <span className="rounded-full bg-[#F4F7FA] px-3 py-1 text-xs font-semibold text-[#6B7280]">{lignes.length} ligne(s)</span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F9FAFB]">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Ligne</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Type</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Prevu</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Realise</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Ecart</th>
                        <th className="px-4 py-3 font-semibold text-[#374151]">Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contextQuery.isLoading ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={6}>Chargement...</td>
                        </tr>
                      ) : lignes.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={6}>Aucune ligne budgetaire trouvee.</td>
                        </tr>
                      ) : (
                        lignes.map((ligne) => {
                          const rate = ligne.montant_prevu > 0 ? (ligne.montant_realise / ligne.montant_prevu) * 100 : 0;
                          return (
                            <tr key={ligne.ligne_budgetaire_id} className="border-b border-[#E5E7EB]">
                              <td className="px-4 py-3 font-semibold text-[#1F2937]">{ligne.libelle}</td>
                              <td className="px-4 py-3 capitalize text-[#6B7280]">{ligne.type_ligne}</td>
                              <td className="px-4 py-3">{formatAmount(ligne.montant_prevu)}</td>
                              <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(ligne.montant_realise)}</td>
                              <td className={`px-4 py-3 font-semibold ${getEcartTone(ligne.ecart_montant)}`}>{formatAmount(ligne.ecart_montant)}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRateTone(rate)}`}>{rate.toFixed(2)}%</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

