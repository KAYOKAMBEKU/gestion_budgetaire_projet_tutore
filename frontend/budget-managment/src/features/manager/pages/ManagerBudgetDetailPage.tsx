import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../api/client";
import { PopupModal } from "../../../components/ui/PopupModal";
import { useAuth } from "../../../context/AuthContext";
import { budgetService } from "../../../services/budgetService";
import { ligneBudgetaireService } from "../../../services/ligneBudgetaireService";
import { projetService } from "../../../services/projetService";
import { validationBudgetService } from "../../../services/validationBudgetService";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { budgetStatusLabels, budgetStatusTones, getBudgetWarnings, sumByType } from "../utils/budgetAnalysis";
import { formatAmount } from "../utils/formatAmount";

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

export function ManagerBudgetDetailPage({
  backLabel = "Retour aux budgets soumis",
  backTo = "/manager/budgets",
  readOnly = false,
}: {
  backLabel?: string;
  backTo?: string;
  readOnly?: boolean;
}) {
  const { id } = useParams<{ id: string }>();
  const budgetId = id ? Number(id) : undefined;
  const queryClient = useQueryClient();
  const { authLoading, currentUser, isAuthenticated, isManager } = useAuth();
  const [validateOpen, setValidateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [submitAdminOpen, setSubmitAdminOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const budgetQuery = useQuery({
    queryKey: ["budgets", budgetId],
    enabled: Boolean(budgetId),
    queryFn: () => budgetService.getBudgetById(budgetId ?? 0),
  });
  const lignesQuery = useQuery({
    queryKey: ["lignes-budgetaires", budgetId],
    enabled: Boolean(budgetId),
    queryFn: () => ligneBudgetaireService.getLignesByBudget(budgetId ?? 0),
  });
  const validationsQuery = useQuery({
    queryKey: ["validations-budgetaires", budgetId],
    enabled: Boolean(budgetId),
    queryFn: () => validationBudgetService.getValidationsByBudget(budgetId ?? 0),
  });
  const projectQuery = useQuery({
    queryKey: ["projets", budgetQuery.data?.projet_id],
    enabled: Boolean(budgetQuery.data?.projet_id),
    queryFn: () => projetService.getProjectById(budgetQuery.data?.projet_id ?? 0),
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!budgetId || !currentUser?.id) {
        throw new Error("Validation impossible.");
      }
      await validationBudgetService.createValidation({
        budget_id: budgetId,
        utilisateur_id: currentUser.id,
        statut_validation: "valide",
        commentaire: comment || undefined,
      });
      return budgetService.validateByGestionnaire(budgetId);
    },
    onSuccess: () => {
      setValidateOpen(false);
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["validations-budgetaires", budgetId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!budgetId || !currentUser?.id || !rejectReason.trim()) {
        throw new Error("Le motif de rejet est obligatoire.");
      }
      await validationBudgetService.createValidation({
        budget_id: budgetId,
        utilisateur_id: currentUser.id,
        statut_validation: "rejete",
        commentaire: rejectReason,
      });
      return budgetService.rejectByGestionnaire(budgetId);
    },
    onSuccess: () => {
      setRejectOpen(false);
      setRejectReason("");
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["validations-budgetaires", budgetId] });
    },
  });

  const submitAdminMutation = useMutation({
    mutationFn: async () => {
      if (!budgetId) {
        throw new Error("Budget introuvable.");
      }
      return budgetService.submitToAdmin(budgetId);
    },
    onSuccess: () => {
      setSubmitAdminOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const budget = budgetQuery.data;
  const project = projectQuery.data;
  const lignes = useMemo(() => lignesQuery.data ?? [], [lignesQuery.data]);
  const recettesPrevues = sumByType(lignes, "recette");
  const depensesPrevues = sumByType(lignes, "depense");
  const warnings = budget ? getBudgetWarnings(budget, lignes) : [];
  const canValidate = !readOnly && (budget?.statut === "soumis_gestionnaire" || budget?.statut === "soumis");
  const canReject = !readOnly && (budget?.statut === "soumis_gestionnaire" || budget?.statut === "soumis");
  const canSubmitAdmin = !readOnly && budget?.statut === "valide_gestionnaire";
  const showRealised = budget ? ["en_execution", "execute", "cloture"].includes(budget.statut) : false;

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au gestionnaire budgetaire." title="Acces refuse" />;
  }
  if (budgetQuery.isLoading || lignesQuery.isLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Chargement du budget...</main>;
  }
  if (budgetQuery.isError || !budget) {
    return <AccessMessage message={budgetQuery.isError ? getApiErrorMessage(budgetQuery.error) : "Budget introuvable."} title="Erreur" />;
  }
  if (currentUser?.departement_id && budget.departement_id !== currentUser.departement_id) {
    return <AccessMessage message="Ce budget n'appartient pas a votre departement." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <Link className="text-sm font-semibold text-[#15803D] hover:text-[#15803D]" to={backTo}>
            {backLabel}
          </Link>

          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Analyse budgetaire</p>
                <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">{budget.libelle}</h1>
                <p className="mt-2 text-sm text-[#6B7280]">{budget.reference}</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${budgetStatusTones[budget.statut]}`}>{budgetStatusLabels[budget.statut]}</span>
            </div>
          </header>

          <section className="grid gap-4 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Projet</p>
              <p className="mt-2 font-semibold text-[#1F2937]">{project?.titre ?? budget.projet?.titre ?? "-"}</p>
              <p className="text-xs text-[#6B7280]">{project?.code ?? budget.projet?.code}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Chef de projet</p>
              <p className="mt-2 font-semibold text-[#1F2937]">{project?.chef_projet ? `${project.chef_projet.prenom ?? ""} ${project.chef_projet.nom}`.trim() : "-"}</p>
              <p className="text-xs text-[#6B7280]">{project?.chef_projet?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Departement</p>
              <p className="mt-2 font-semibold text-[#1F2937]">{project?.departement?.nom ?? budget.departement_id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Periode du projet</p>
              <p className="mt-2 font-semibold text-[#1F2937]">{project?.date_debut_prevue ?? budget.projet?.date_debut_prevue ?? "-"} au {project?.date_fin_prevue ?? budget.projet?.date_fin_prevue ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Periode du budget</p>
              <p className="mt-2 font-semibold text-[#1F2937]">{project?.date_debut_prevue ?? budget.projet?.date_debut_prevue ?? "-"} au {project?.date_fin_prevue ?? budget.projet?.date_fin_prevue ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Exercice budgetaire</p>
              <p className="mt-2 font-semibold text-[#1F2937]">{budget.exercice?.libelle ?? budget.exercice_id}</p>
              <p className="text-xs text-[#6B7280]">{budget.exercice?.date_debut} au {budget.exercice?.date_fin}</p>
            </div>
          </section>

          {warnings.length ? (
            <section className="grid gap-2 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] p-4 text-left text-sm font-medium text-[#92400E]">
              {warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </section>
          ) : null}

          <section className="grid gap-3 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-[#FEE2E2] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#DC2626]">Depenses prevues</p>
              <p className="mt-2 text-lg font-bold text-[#B91C1C]">{formatAmount(depensesPrevues)}</p>
            </div>
            <div className="rounded-lg bg-[#DCFCE7] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">Recettes prevues</p>
              <p className="mt-2 text-lg font-bold text-[#15803D]">{formatAmount(recettesPrevues)}</p>
            </div>
            <div className="rounded-lg bg-[#DBEAFE] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Solde previsionnel</p>
              <p className="mt-2 text-lg font-bold text-[#1D4ED8]">{formatAmount(recettesPrevues - depensesPrevues)}</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Lignes</p>
              <p className="mt-2 text-lg font-bold text-[#1F2937]">{lignes.length}</p>
            </div>
          </section>

          {showRealised ? (
            <section className="grid gap-3 rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB] sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Recettes realisees</p>
                <p className="mt-2 text-lg font-bold text-[#1F2937]">{formatAmount(budget.total_recettes_realisees ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Depenses realisees</p>
                <p className="mt-2 text-lg font-bold text-[#1F2937]">{formatAmount(budget.total_depenses_realisees ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Taux execution</p>
                <p className="mt-2 text-lg font-bold text-[#1F2937]">{Number(budget.taux_execution_budgetaire ?? 0).toFixed(2)}%</p>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <h2 className="text-lg font-bold text-[#1F2937]">Lignes budgetaires</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#374151]">Libelle</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Type</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Categorie</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Montant prevu</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Realise</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne) => (
                    <tr key={ligne.id} className="border-b border-[#E5E7EB]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">{ligne.libelle}</p>
                        <p className="text-xs text-[#6B7280]">{ligne.description || "Sans commentaire"}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-[#6B7280]">{ligne.type_ligne}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{ligne.categorie?.nom ?? ligne.categorie_id}</td>
                      <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(ligne.montant_prevu)}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{formatAmount(ligne.montant_realise ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <h2 className="text-lg font-bold text-[#1F2937]">Commentaires</h2>
            <div className="mt-3 grid gap-2">
              {validationsQuery.data?.length ? (
                validationsQuery.data.map((validation) => (
                  <div key={validation.id} className="rounded-md bg-[#F9FAFB] px-3 py-2 text-sm text-[#6B7280]">
                    <span className="font-semibold text-[#1F2937]">{validation.statut_validation}</span> {validation.commentaire || "Sans commentaire"}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">{budget.description || "Aucun commentaire disponible."}</p>
              )}
            </div>
          </section>

          {!readOnly ? (
            <section className="flex flex-wrap justify-end gap-3 rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#E5E7EB]">
              <button className="btn-primary rounded-md px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#166F48] disabled:opacity-60" disabled={!canValidate || validateMutation.isPending} onClick={() => setValidateOpen(true)}>
                Valider le budget
              </button>
              <button className="btn-danger rounded-md px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-60" disabled={!canReject || rejectMutation.isPending} onClick={() => setRejectOpen(true)}>
                Rejeter le budget
              </button>
              <button className="btn-primary rounded-md px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2D46] disabled:opacity-60" disabled={!canSubmitAdmin || submitAdminMutation.isPending} onClick={() => setSubmitAdminOpen(true)}>
                Soumettre a l'Administrateur
              </button>
            </section>
          ) : null}
        </div>
      </div>

      <PopupModal open={validateOpen} title="Valider le budget" onClose={() => setValidateOpen(false)}>
        <div className="grid gap-4 text-left">
          <label className="grid gap-1 text-sm font-semibold text-[#374151]">
            Commentaire
            <textarea className="min-h-24 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" value={comment} onChange={(event) => setComment(event.target.value)} />
          </label>
          {validateMutation.isError ? <p className="text-sm font-semibold text-[#DC2626]">{getApiErrorMessage(validateMutation.error)}</p> : null}
          <div className="flex justify-end gap-3">
            <button className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#374151]" onClick={() => setValidateOpen(false)}>Annuler</button>
            <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={validateMutation.isPending} onClick={() => validateMutation.mutate()}>
              Confirmer
            </button>
          </div>
        </div>
      </PopupModal>

      <PopupModal open={rejectOpen} title="Rejeter le budget" onClose={() => setRejectOpen(false)}>
        <div className="grid gap-4 text-left">
          <label className="grid gap-1 text-sm font-semibold text-[#374151]">
            Motif de rejet
            <textarea className="min-h-24 rounded-md border border-[#E5E7EB] px-3 py-2 font-normal" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
          </label>
          {rejectMutation.isError ? <p className="text-sm font-semibold text-[#DC2626]">{getApiErrorMessage(rejectMutation.error)}</p> : null}
          <div className="flex justify-end gap-3">
            <button className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#374151]" onClick={() => setRejectOpen(false)}>Annuler</button>
            <button className="btn-danger rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={rejectMutation.isPending || !rejectReason.trim()} onClick={() => rejectMutation.mutate()}>
              Rejeter
            </button>
          </div>
        </div>
      </PopupModal>

      <PopupModal open={submitAdminOpen} title="Soumettre a l'Administrateur" onClose={() => setSubmitAdminOpen(false)}>
        <div className="grid gap-4 text-left">
          <p className="text-sm text-[#6B7280]">Le budget valide par le Gestionnaire sera transmis a l'Administrateur.</p>
          {submitAdminMutation.isError ? <p className="text-sm font-semibold text-[#DC2626]">{getApiErrorMessage(submitAdminMutation.error)}</p> : null}
          <div className="flex justify-end gap-3">
            <button className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#374151]" onClick={() => setSubmitAdminOpen(false)}>Annuler</button>
            <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={submitAdminMutation.isPending} onClick={() => submitAdminMutation.mutate()}>
              Confirmer
            </button>
          </div>
        </div>
      </PopupModal>
    </main>
  );
}
