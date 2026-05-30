import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../../api/client";
import { PopupModal } from "../../../../components/ui/PopupModal";
import { useAuth } from "../../../../context/AuthContext";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import { budgetService } from "../../../../services/budgetService";
import { ligneBudgetaireService } from "../../../../services/ligneBudgetaireService";
import { projetService } from "../../../../services/projetService";
import { validationBudgetService } from "../../../../services/validationBudgetService";
import type { Budget } from "../../../../types/budget";
import type { LigneBudgetaire } from "../../../../types/ligneBudgetaire";
import type { Projet } from "../../../../types/projet";
import { budgetStatusLabels, budgetStatusTones, sumByType } from "../../../manager/utils/budgetAnalysis";
import { formatAmount } from "../../../manager/utils/formatAmount";
import { useApproveBudget, useRejectBudget, useStartBudgetExecution, useSubmittedBudgets } from "../../hooks/useBudgetValidation";
import { ConfirmModal } from "../ConfirmModal";
import { InlineError, LoadingState, SectionHeader } from "../SectionHeader";

type AdminBudgetAction = "approve" | "reject" | "start";

function useBudgetDetails(budget?: Budget | null) {
  const linesQuery = useQuery({
    queryKey: ["lignes-budgetaires", budget?.id],
    enabled: Boolean(budget?.id),
    queryFn: () => ligneBudgetaireService.getLignesByBudget(budget?.id ?? 0),
  });
  const projectQuery = useQuery({
    queryKey: ["projets", budget?.projet_id],
    enabled: Boolean(budget?.projet_id),
    queryFn: () => projetService.getProjectById(budget?.projet_id ?? 0),
  });
  const validationsQuery = useQuery({
    queryKey: ["validations-budgetaires", budget?.id],
    enabled: Boolean(budget?.id),
    queryFn: () => validationBudgetService.getValidationsByBudget(budget?.id ?? 0),
  });

  return { linesQuery, projectQuery, validationsQuery };
}

function BudgetDetailPanel({ budget, lines, project }: { budget: Budget; lines: LigneBudgetaire[]; project?: Projet }) {
  const recettesPrevues = sumByType(lines, "recette");
  const depensesPrevues = sumByType(lines, "depense");

  return (
    <div className="grid gap-5 text-left">
      <section className="grid gap-4 rounded-lg bg-[#F9FAFB] p-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Projet</p>
          <p className="mt-1 font-semibold text-[#1F2937]">{project?.titre ?? budget.projet?.titre ?? budget.projet_id}</p>
          <p className="text-xs text-[#6B7280]">{project?.code ?? budget.projet?.code}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Chef de projet</p>
          <p className="mt-1 font-semibold text-[#1F2937]">{project?.chef_projet ? `${project.chef_projet.prenom ?? ""} ${project.chef_projet.nom}`.trim() : "-"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Exercice</p>
          <p className="mt-1 font-semibold text-[#1F2937]">{budget.exercice?.libelle ?? budget.exercice_id}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Dates projet</p>
          <p className="mt-1 font-semibold text-[#1F2937]">{project?.date_debut_prevue ?? "-"} au {project?.date_fin_prevue ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget previsionnel</p>
          <p className="mt-1 font-semibold text-[#1F2937]">{formatAmount(depensesPrevues)} depenses</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Budget realise</p>
          <p className="mt-1 font-semibold text-[#1F2937]">{formatAmount(budget.total_depenses_realisees ?? 0)}</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-[#FEE2E2] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#DC2626]">Depenses prevues</p>
          <p className="mt-2 font-bold text-[#B91C1C]">{formatAmount(depensesPrevues)}</p>
        </div>
        <div className="rounded-lg bg-[#DCFCE7] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">Recettes prevues</p>
          <p className="mt-2 font-bold text-[#15803D]">{formatAmount(recettesPrevues)}</p>
        </div>
        <div className="rounded-lg bg-[#DBEAFE] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Solde previsionnel</p>
          <p className="mt-2 font-bold text-[#1D4ED8]">{formatAmount(recettesPrevues - depensesPrevues)}</p>
        </div>
      </section>

      <section className="overflow-hidden bg-white/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-4 py-3">Ligne</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Categorie</th>
              <th className="px-4 py-3">Montant prevu</th>
              <th className="px-4 py-3">Realise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#1F2937]">{line.libelle}</p>
                  <p className="text-xs text-[#6B7280]">{line.description || "Sans commentaire"}</p>
                </td>
                <td className="px-4 py-3 capitalize text-[#6B7280]">{line.type_ligne}</td>
                <td className="px-4 py-3 text-[#6B7280]">{line.categorie?.nom ?? line.categorie_id}</td>
                <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(line.montant_prevu)}</td>
                <td className="px-4 py-3 text-[#6B7280]">{formatAmount(line.montant_realise ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function BudgetDecisionModal({
  budget,
  action,
  onClose,
}: {
  budget: Budget | null;
  action: AdminBudgetAction | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const approveBudget = useApproveBudget();
  const rejectBudget = useRejectBudget();
  const startExecution = useStartBudgetExecution();
  const [reason, setReason] = useState("");

  const storeDecision = useMutation({
    mutationFn: async ({ status, commentaire }: { status: "valide" | "rejete"; commentaire?: string }) => {
      if (!budget || !currentUser?.id) {
        return null;
      }
      return validationBudgetService.createValidation({
        budget_id: budget.id,
        utilisateur_id: currentUser.id,
        statut_validation: status,
        commentaire,
      });
    },
  });

  if (!budget || !action) {
    return null;
  }

  const currentBudget = budget;
  const isReject = action === "reject";
  const title = action === "approve" ? "Approuver definitivement" : action === "start" ? "Demarrer l'execution" : "Rejeter definitivement";
  const loading = approveBudget.isPending || rejectBudget.isPending || startExecution.isPending || storeDecision.isPending;

  async function confirm() {
    try {
      if (action === "approve") {
        await storeDecision.mutateAsync({ status: "valide", commentaire: "Approbation finale Administrateur" });
        await approveBudget.mutateAsync(currentBudget.id);
        dispatch(showToast({ message: "Budget approuve definitivement.", type: "success" }));
      } else if (action === "reject") {
        if (!reason.trim()) {
          dispatch(showToast({ message: "Le motif de rejet est obligatoire.", type: "error" }));
          return;
        }
        await storeDecision.mutateAsync({ status: "rejete", commentaire: reason });
        await rejectBudget.mutateAsync(currentBudget.id);
        dispatch(showToast({ message: "Budget rejete definitivement.", type: "success" }));
      } else {
        await startExecution.mutateAsync(currentBudget.id);
        dispatch(showToast({ message: "Execution du budget demarree.", type: "success" }));
      }
      setReason("");
      onClose();
      void queryClient.invalidateQueries({ queryKey: ["validations-budgetaires", currentBudget.id] });
    } catch (error) {
      dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  return (
    <ConfirmModal
      confirmLabel={action === "approve" ? "Approuver" : action === "start" ? "Demarrer" : "Rejeter"}
      loading={loading}
      message={
        <div className="grid gap-3 text-left">
          <p>{action === "start" ? "Demarrer l'execution de ce budget approuve ?" : `${title} le budget ${currentBudget.reference} ?`}</p>
          {isReject ? (
            <label className="grid gap-1 text-sm font-semibold text-[#374151]">
              Motif de rejet
              <textarea className="min-h-24 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
          ) : null}
        </div>
      }
      open={Boolean(action)}
      title={title}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}

export function SubmittedBudgetsList({ approvedOnly = false }: { approvedOnly?: boolean }) {
  const budgetsQuery = useSubmittedBudgets();
  const approvedQuery = useQuery({
    queryKey: ["budgets", "admin-approved-list"],
    queryFn: async () => {
      const statuses = ["approuve_admin", "en_execution", "execute", "cloture"];
      const budgets = await Promise.all(statuses.map((status) => budgetService.getBudgetsByStatut(status)));
      return budgets.flat();
    },
    enabled: approvedOnly,
  });
  const sourceQuery = approvedOnly ? approvedQuery : budgetsQuery;
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [decision, setDecision] = useState<AdminBudgetAction | null>(null);
  const details = useBudgetDetails(selectedBudget);
  const budgets = sourceQuery.data ?? [];

  const gestionnaireValidation = useMemo(
    () => (details.validationsQuery.data ?? []).find((validation) => validation.statut_validation === "valide"),
    [details.validationsQuery.data],
  );

  if (sourceQuery.isLoading) {
    return <LoadingState />;
  }

  if (sourceQuery.isError) {
    return <InlineError message={getApiErrorMessage(sourceQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        buttonLabel="Actualiser"
        subtitle={approvedOnly ? "Budgets approuves, prets pour l'execution ou deja executes." : "Budgets valides par les Gestionnaires et transmis a l'Administrateur."}
        title={approvedOnly ? "Budgets approuves" : "Budgets a approuver"}
        onAdd={() => void sourceQuery.refetch()}
      />

      <div className="overflow-hidden bg-white/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Projet</th>
              <th className="px-4 py-3">Departement</th>
              <th className="px-4 py-3">Exercice</th>
              <th className="px-4 py-3">Total previsionnel</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Soumission</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {budgets.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={8}>Aucun budget trouve.</td>
              </tr>
            ) : (
              budgets.map((budget) => (
                <tr key={budget.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1F2937]">{budget.reference}</p>
                    <p className="text-xs text-[#6B7280]">{budget.libelle}</p>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{budget.projet?.titre ?? budget.projet_id}</td>
                  <td className="px-4 py-3 text-[#6B7280]">{budget.projet?.departement?.nom ?? budget.departement_id}</td>
                  <td className="px-4 py-3 text-[#6B7280]">{budget.exercice?.libelle ?? budget.exercice_id}</td>
                  <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(Number(budget.montant_total_prevu ?? 0))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${budgetStatusTones[budget.statut]}`}>{budgetStatusLabels[budget.statut]}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{budget.date_creation ? new Date(budget.date_creation).toLocaleDateString("fr-FR") : "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm font-semibold text-[#15803D] hover:text-[#15803D]" onClick={() => setSelectedBudget(budget)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PopupModal open={Boolean(selectedBudget)} title={selectedBudget ? `Budget ${selectedBudget.reference}` : "Budget"} onClose={() => setSelectedBudget(null)}>
        {selectedBudget ? (
          <div className="grid gap-5">
            <BudgetDetailPanel budget={selectedBudget} lines={details.linesQuery.data ?? []} project={details.projectQuery.data} />
            <section className="rounded-lg bg-white/30 p-4 text-left">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#6B7280]">Validation Gestionnaire</h3>
              <p className="mt-2 text-sm text-[#374151]">{gestionnaireValidation?.commentaire || "Aucun commentaire de validation disponible."}</p>
            </section>
            <section className="grid gap-3 rounded-lg bg-white/30 p-4 text-left md:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#6B7280]">Budget previsionnel</h3>
                <p className="mt-2 text-sm text-[#6B7280]">Soumis, analyse et approuve avant execution.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#6B7280]">Budget realise</h3>
                <p className="mt-2 text-sm text-[#6B7280]">Calcule plus tard depuis les entrees et sorties du Comptable.</p>
              </div>
            </section>
            <div className="flex flex-wrap justify-end gap-3">
              {!approvedOnly ? (
                <>
                  <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#166F48]" onClick={() => setDecision("approve")}>Approuver definitivement</button>
                  <button className="btn-danger rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C]" onClick={() => setDecision("reject")}>Rejeter definitivement</button>
                </>
              ) : selectedBudget.statut === "approuve_admin" ? (
                <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2D46]" onClick={() => setDecision("start")}>Demarrer l'execution</button>
              ) : null}
            </div>
          </div>
        ) : null}
      </PopupModal>
      <BudgetDecisionModal budget={selectedBudget} action={decision} onClose={() => setDecision(null)} />
    </div>
  );
}
