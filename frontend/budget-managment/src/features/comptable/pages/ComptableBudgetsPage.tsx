import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { ComptableSidebar } from "../components/ComptableSidebar";
import { useExecutableBudgets } from "../hooks/useComptableBudget";
import { formatAmount } from "../../manager/utils/formatAmount";

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

export function ComptableBudgetsPage({ view = "budgets" }: { view?: "budgets" | "entrees" | "sorties" | "realisations" | "ecarts" }) {
  const { authLoading, isAuthenticated, isComptable } = useAuth();
  const budgetsQuery = useExecutableBudgets();

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isComptable) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Comptable." title="Acces refuse" />;
  }

  const titles = {
    budgets: "Budgets en execution",
    entrees: "Entrees financieres",
    sorties: "Sorties financieres",
    realisations: "Realisations budgetaires",
    ecarts: "Analyse des ecarts",
  };
  const actionLabels = {
    budgets: "Executer",
    entrees: "Saisir une entree",
    sorties: "Saisir une sortie",
    realisations: "Voir le realise",
    ecarts: "Voir les ecarts",
  };

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ComptableSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Execution budgetaire</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">{titles[view]}</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Selectionnez un budget pour consulter le realise, enregistrer les mouvements et suivre les ecarts.</p>
          </header>

          {budgetsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(budgetsQuery.error)}</div> : null}

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#374151]">Projet</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Departement</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Exercice</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Budget previsionnel</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Statut</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Periode projet</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Periode budget</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetsQuery.isLoading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={8}>Chargement...</td>
                    </tr>
                  ) : (budgetsQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={8}>Aucun budget approuve ou en execution.</td>
                    </tr>
                  ) : (
                    (budgetsQuery.data ?? []).map((budget) => (
                      <tr key={budget.id} className="border-b border-[#E5E7EB] hover:bg-[#F4F7FA]">
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">{budget.projet?.titre ?? budget.projet_id ?? "-"}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{budget.projet?.departement?.nom ?? budget.departement_id}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{budget.exercice?.libelle ?? budget.exercice_id}</td>
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(budget.montant_total_prevu ?? 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${budget.statut === "en_execution" ? "bg-[#DBEAFE] text-[#2563EB] ring-blue-200" : "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]"}`}>
                            {budget.statut === "en_execution" ? "En execution" : "Approuve"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">{budget.projet?.date_debut_prevue ?? "-"} au {budget.projet?.date_fin_prevue ?? "-"}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{budget.projet?.date_debut_prevue ?? "-"} au {budget.projet?.date_fin_prevue ?? "-"}</td>
                        <td className="px-4 py-3">
                          <Link className="font-semibold text-[#15803D] hover:text-[#166F48]" to={`/comptable/budgets/${budget.id}`}>
                            {actionLabels[view]}
                          </Link>
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
    </main>
  );
}
