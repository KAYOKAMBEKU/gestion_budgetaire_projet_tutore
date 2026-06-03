import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { CurrencySelector } from "../../../components/ui/CurrencySelector";
import { PopupModal } from "../../../components/ui/PopupModal";
import { useAuth } from "../../../context/AuthContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { budgetService } from "../../../services/budgetService";
import { ligneBudgetaireService } from "../../../services/ligneBudgetaireService";
import { projetService } from "../../../services/projetService";
import type { Budget } from "../../../types/budget";
import type { LigneBudgetaire } from "../../../types/ligneBudgetaire";
import type { Projet } from "../../../types/projet";
import { formatDate } from "../../../utils/formatDate";
import { EditIcon, EyeIcon } from "../components/ActionIcon";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { budgetStatusLabels, budgetStatusTones, sumByType } from "../utils/budgetAnalysis";
import { getBudgetCurrency } from "../utils/budgetCurrency";
import { formatAmount } from "../utils/formatAmount";

interface BudgetRow {
  budget: Budget;
  lignes: LigneBudgetaire[];
  project?: Projet;
}

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

function useDepartmentBudgetRows(departementId?: number) {
  return useQuery({
    queryKey: ["manager-budget-rows", departementId],
    enabled: Boolean(departementId),
    queryFn: async () => {
      const budgets = await budgetService.getBudgetsByDepartement(departementId ?? 0);
      const projects = await projetService.getProjectsByDepartement(departementId ?? 0);
      const projectsById = new Map(projects.map((project) => [project.id, project]));
      const rows = await Promise.all(
        budgets.map(async (budget) => ({
          budget,
          lignes: await ligneBudgetaireService.getLignesByBudget(budget.id),
          project: budget.projet_id ? projectsById.get(budget.projet_id) : undefined,
        })),
      );
      return rows;
    },
  });
}

export function ManagerBudgetsPage({ analysisOnly = false }: { analysisOnly?: boolean }) {
  useCurrency();
  const { authLoading, currentUser, isAuthenticated, isManager } = useAuth();
  const [selectedDetails, setSelectedDetails] = useState<BudgetRow | null>(null);
  const rowsQuery = useDepartmentBudgetRows(currentUser?.departement_id);
  const rows = (rowsQuery.data ?? []).filter((row) =>
    analysisOnly ? row.budget.statut !== "brouillon" : ["soumis", "soumis_gestionnaire", "valide_gestionnaire", "soumis_admin"].includes(row.budget.statut),
  );
  const isPendingAnalysis = (status: string) => ["soumis", "soumis_gestionnaire"].includes(status);

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au gestionnaire budgetaire." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1F8A5B]">Espace gestionnaire</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">{analysisOnly ? "Analyse budgetaire" : "Budgets soumis"}</h1>
            <p className="mt-2 text-sm text-[#6B7280]">{currentUser?.departement?.nom ?? "Departement du gestionnaire"}</p>
          </header>

          {!currentUser?.departement_id ? (
            <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3 text-left text-sm font-medium text-[#92400E]">
              Votre compte Gestionnaire n'est rattache a aucun departement.
            </div>
          ) : null}
          {rowsQuery.isError ? (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-left text-sm font-medium text-[#DC2626]">{getApiErrorMessage(rowsQuery.error)}</div>
          ) : null}

          <section className="max-w-full overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="max-w-full overflow-hidden border border-[#E5E7EB]">
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-[1120px] text-left text-sm">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="px-4 py-3 font-semibold text-[#374151]">Projet</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Chef de projet</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Departement</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Exercice</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Depenses prevues</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Recettes prevues</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Solde prev.</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Statut</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Soumission</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsQuery.isLoading ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={10}>Chargement...</td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={10}>Aucun budget trouve pour votre departement.</td>
                      </tr>
                    ) : (
                      rows.map(({ budget, lignes, project }: BudgetRow) => {
                        const recettes = sumByType(lignes, "recette");
                        const depenses = sumByType(lignes, "depense");
                        const currency = getBudgetCurrency(budget);
                        return (
                          <tr key={budget.id} className="border-b border-[#E5E7EB] hover:bg-[#F4F7FA]">
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">{project?.titre ?? budget.projet?.titre ?? budget.projet_id ?? "-"}</td>
                            <td className="px-4 py-3 text-[#6B7280]">{project?.chef_projet ? `${project.chef_projet.prenom ?? ""} ${project.chef_projet.nom}`.trim() : "-"}</td>
                            <td className="px-4 py-3 text-[#6B7280]">{project?.departement?.nom ?? budget.departement_id}</td>
                            <td className="px-4 py-3 text-[#6B7280]">{budget.exercice?.libelle ?? budget.exercice_id}</td>
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(depenses, currency)}</td>
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(recettes, currency)}</td>
                            <td className={`px-4 py-3 font-semibold ${(recettes - depenses) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{formatAmount(recettes - depenses, currency)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${budgetStatusTones[budget.statut]}`}>{budgetStatusLabels[budget.statut]}</span>
                            </td>
                            <td className="px-4 py-3 text-[#6B7280]">{formatDate(budget.date_creation)}</td>
                            <td className="px-4 py-3">
                              {analysisOnly ? (
                                isPendingAnalysis(budget.statut) ? (
                                  <Link className="inline-flex items-center gap-2 rounded-md border border-[#0F3D5E] px-3 py-1.5 text-xs font-semibold text-[#0F3D5E] hover:bg-[#0F3D5E] hover:text-white" to={`/manager/budgets/${budget.id}`}>
                                    <EditIcon />
                                    Analyser
                                  </Link>
                                ) : (
                                  <button className="inline-flex items-center gap-2 rounded-md border border-[#0F3D5E] px-3 py-1.5 text-xs font-semibold text-[#0F3D5E] hover:bg-[#0F3D5E] hover:text-white" onClick={() => setSelectedDetails({ budget, lignes, project })} type="button">
                                    <EyeIcon />
                                    Details
                                  </button>
                                )
                              ) : (
                                <Link className="inline-flex items-center gap-2 rounded-md border border-[#0F3D5E] px-3 py-1.5 text-xs font-semibold text-[#0F3D5E] hover:bg-[#0F3D5E] hover:text-white" to={`/manager/budgets/${budget.id}`}>
                                  <EditIcon />
                                  Analyser
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
      <PopupModal maxWidth="max-w-7xl" open={Boolean(selectedDetails)} title="Details du budget" onClose={() => setSelectedDetails(null)}>
        {selectedDetails ? (
          <div className="grid gap-5">
            <CurrencySelector variant="modal" />
            <section className="grid gap-4 rounded-lg bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB] md:grid-cols-3">
              <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget</p>
                <p className="mt-1 font-bold text-[#1F2937]">{selectedDetails.budget.libelle}</p>
                <p className="text-xs text-[#6B7280]">{selectedDetails.budget.reference}</p>
              </div>
              <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Projet</p>
                <p className="mt-1 font-bold text-[#1F2937]">{selectedDetails.project?.titre ?? selectedDetails.budget.projet?.titre ?? "-"}</p>
                <p className="text-xs text-[#6B7280]">{selectedDetails.project?.code ?? selectedDetails.budget.projet?.code ?? ""}</p>
              </div>
              <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Statut</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${budgetStatusTones[selectedDetails.budget.statut]}`}>{budgetStatusLabels[selectedDetails.budget.statut]}</span>
                <p className="mt-2 text-xs font-semibold text-[#6B7280]">Devise: {getBudgetCurrency(selectedDetails.budget)}</p>
              </div>
              <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Chef de projet</p>
                <p className="mt-1 font-semibold text-[#1F2937]">{selectedDetails.project?.chef_projet ? `${selectedDetails.project.chef_projet.prenom ?? ""} ${selectedDetails.project.chef_projet.nom}`.trim() : "-"}</p>
                <p className="text-xs text-[#6B7280]">{selectedDetails.project?.chef_projet?.email ?? ""}</p>
              </div>
              <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Exercice</p>
                <p className="mt-1 font-semibold text-[#1F2937]">{selectedDetails.budget.exercice?.libelle ?? selectedDetails.budget.exercice_id}</p>
              </div>
              <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Date de soumission</p>
                <p className="mt-1 font-semibold text-[#1F2937]">{formatDate(selectedDetails.budget.date_creation)}</p>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Depenses prevues</p>
                <p className="mt-2 text-xl font-bold text-[#0F3D5E]">{formatAmount(sumByType(selectedDetails.lignes, "depense"), getBudgetCurrency(selectedDetails.budget))}</p>
              </div>
              <div className="rounded-md bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Recettes prevues</p>
                <p className="mt-2 text-xl font-bold text-[#15803D]">{formatAmount(sumByType(selectedDetails.lignes, "recette"), getBudgetCurrency(selectedDetails.budget))}</p>
              </div>
              <div className="rounded-md bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Total realise</p>
                <p className="mt-2 text-xl font-bold text-[#1F2937]">{formatAmount(selectedDetails.budget.montant_total_realise ?? 0, getBudgetCurrency(selectedDetails.budget))}</p>
              </div>
            </section>

            <section className="rounded-lg bg-white shadow-sm ring-1 ring-[#E5E7EB]">
              <div className="flex flex-col gap-1 border-b border-[#E5E7EB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#1F2937]">Lignes budgetaires</h3>
                <p className="text-xs font-medium text-[#6B7280]">{selectedDetails.lignes.length} ligne(s)</p>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#374151]">
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="w-[32%] px-4 py-3">Libelle</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Categorie</th>
                      <th className="px-4 py-3 text-right">Prevu</th>
                      <th className="px-4 py-3 text-right">Realise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {selectedDetails.lignes.map((ligne) => (
                      <tr key={ligne.id} className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">{ligne.libelle}</td>
                        <td className="px-4 py-3 capitalize text-[#6B7280]">{ligne.type_ligne}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{ligne.categorie?.nom ?? ligne.categorie_id}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1F2937]">{formatAmount(ligne.montant_prevu, getBudgetCurrency(selectedDetails.budget))}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#6B7280]">{formatAmount(ligne.montant_realise ?? 0, getBudgetCurrency(selectedDetails.budget))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </PopupModal>
    </main>
  );
}
