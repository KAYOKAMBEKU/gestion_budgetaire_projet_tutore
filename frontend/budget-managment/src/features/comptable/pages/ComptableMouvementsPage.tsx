import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { mouvementFinancierService } from "../../../services/mouvementFinancierService";
import type { TypeMouvementFinancier } from "../../../types/mouvementFinancier";
import { formatAmount } from "../../manager/utils/formatAmount";
import { ComptableSidebar } from "../components/ComptableSidebar";
import { useExecutableBudgets } from "../hooks/useComptableBudget";

type MovementFilter = "tous" | TypeMouvementFinancier;

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

export function ComptableMouvementsPage() {
  const { authLoading, isAuthenticated, isComptable } = useAuth();
  const [typeFilter, setTypeFilter] = useState<MovementFilter>("tous");
  const budgetsQuery = useExecutableBudgets();
  const mouvementsQuery = useQuery({
    queryKey: ["mouvements-financiers", "comptable", typeFilter],
    queryFn: () =>
      mouvementFinancierService.getMouvements({
        type_mouvement: typeFilter === "tous" ? undefined : typeFilter,
      }),
  });

  const budgetsById = useMemo(() => new Map((budgetsQuery.data ?? []).map((budget) => [budget.id, budget])), [budgetsQuery.data]);
  const mouvements = mouvementsQuery.data ?? [];
  const totalEntrees = mouvements.filter((mouvement) => mouvement.type_mouvement === "entree").reduce((sum, mouvement) => sum + Number(mouvement.montant ?? 0), 0);
  const totalSorties = mouvements.filter((mouvement) => mouvement.type_mouvement === "sortie").reduce((sum, mouvement) => sum + Number(mouvement.montant ?? 0), 0);

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
            <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Suivi comptable</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Mouvements financiers</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Toutes les entrees et sorties enregistrees depuis les budgets en execution.</p>
          </header>

          {mouvementsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(mouvementsQuery.error)}</div> : null}
          {budgetsQuery.isError ? <div className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#DC2626]">{getApiErrorMessage(budgetsQuery.error)}</div> : null}

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Entrees</p>
              <p className="mt-2 text-xl font-bold text-[#1F2937]">{formatAmount(totalEntrees)}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Sorties</p>
              <p className="mt-2 text-xl font-bold text-[#1F2937]">{formatAmount(totalSorties)}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Solde realise</p>
              <p className="mt-2 text-xl font-bold text-[#1F2937]">{formatAmount(totalEntrees - totalSorties)}</p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Journal des mouvements</h2>
                <p className="mt-1 text-sm text-[#6B7280]">Le budget realise utilise les mouvements: entrees, sorties et solde realise.</p>
              </div>
              <select
                className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#1F2937]"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as MovementFilter)}
              >
                <option value="tous">Toutes les operations</option>
                <option value="entree">Entrees uniquement</option>
                <option value="sortie">Sorties uniquement</option>
              </select>
            </div>

            <div className="mt-5 overflow-hidden border border-[#E5E7EB]">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="px-4 py-3 font-semibold text-[#374151]">Date</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Type</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Libelle</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Projet / Budget</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Reference</th>
                      <th className="px-4 py-3 text-right font-semibold text-[#374151]">Montant</th>
                      <th className="px-4 py-3 font-semibold text-[#374151]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mouvementsQuery.isLoading ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={7}>Chargement...</td>
                      </tr>
                    ) : mouvements.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={7}>Aucun mouvement trouve.</td>
                      </tr>
                    ) : (
                      mouvements.map((mouvement) => {
                        const budget = budgetsById.get(mouvement.budget_id);
                        const isEntree = mouvement.type_mouvement === "entree";

                        return (
                          <tr className="border-b border-[#E5E7EB] hover:bg-[#F4F7FA]" key={mouvement.id}>
                            <td className="px-4 py-3 text-[#6B7280]">{mouvement.date_mouvement}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${isEntree ? "bg-[#DCFCE7] text-[#166F48] ring-[#BBF7D0]" : "bg-[#FEE2E2] text-[#B91C1C] ring-[#FECACA]"}`}>
                                {isEntree ? "Entree" : "Sortie"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#1F2937]">{mouvement.libelle}</p>
                              <p className="text-xs text-[#6B7280]">{mouvement.categorie ?? "-"}</p>
                            </td>
                            <td className="px-4 py-3 text-[#6B7280]">
                              <p className="font-semibold text-[#1F2937]">{budget?.projet?.titre ?? `Projet ${mouvement.projet_id}`}</p>
                              <p className="text-xs">{budget?.reference ?? `Budget ${mouvement.budget_id}`}</p>
                            </td>
                            <td className="px-4 py-3 text-[#6B7280]">{mouvement.reference_paiement ?? "-"}</td>
                            <td className="px-4 py-3 text-right font-bold text-[#1F2937]">{formatAmount(mouvement.montant)}</td>
                            <td className="px-4 py-3">
                              <Link className="text-sm font-semibold text-[#15803D] hover:text-[#166F48] hover:underline" to={`/comptable/budgets/${mouvement.budget_id}`}>
                                Executer
                              </Link>
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
    </main>
  );
}
