import { useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../../api/client";
import { PopupModal } from "../../../../components/ui/PopupModal";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import type { Budget } from "../../../../types/budget";
import type { ExerciceBudgetaire, ExerciceBudgetaireCreate, ExerciceBudgetaireUpdate } from "../../../../types/exerciceBudgetaire";
import { formatAmount } from "../../../manager/utils/formatAmount";
import { useValidatedBudgets } from "../../hooks/useBudgetValidation";
import {
  useActiveExerciceBudgetaire,
  useCloseExerciceBudgetaire,
  useCreateExerciceBudgetaire,
  useDeleteExerciceBudgetaire,
  useExercicesBudgetaires,
  useOpenExerciceBudgetaire,
  useUpdateExerciceBudgetaire,
} from "../../hooks/useExercicesBudgetaires";
import { ConfirmModal } from "../ConfirmModal";
import { DataTable, type DataTableColumn } from "../DataTable";
import { InlineError, LoadingState, SectionHeader } from "../SectionHeader";
import { StatusBadge } from "../StatusBadge";
import { ExerciceBudgetaireForm } from "./ExerciceBudgetaireForm";

export function ExerciceBudgetaireList() {
  const dispatch = useAppDispatch();
  const exercicesQuery = useExercicesBudgetaires();
  const activeQuery = useActiveExerciceBudgetaire();
  const validatedBudgetsQuery = useValidatedBudgets();
  const createExercice = useCreateExerciceBudgetaire();
  const updateExercice = useUpdateExerciceBudgetaire();
  const deleteExercice = useDeleteExerciceBudgetaire();
  const openExercice = useOpenExerciceBudgetaire();
  const closeExercice = useCloseExerciceBudgetaire();
  const [formExercice, setFormExercice] = useState<ExerciceBudgetaire | null>();
  const [deleteTarget, setDeleteTarget] = useState<ExerciceBudgetaire | null>(null);

  function notifySuccess(message: string) {
    dispatch(showToast({ message, type: "success" }));
  }

  function notifyError(error: unknown) {
    dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
  }

  function submitForm(payload: ExerciceBudgetaireCreate | ExerciceBudgetaireUpdate) {
    if (formExercice) {
      updateExercice.mutate({ id: formExercice.id, payload: payload as ExerciceBudgetaireUpdate }, { onSuccess: () => { setFormExercice(undefined); notifySuccess("Exercice modifie."); }, onError: notifyError });
      return;
    }
    createExercice.mutate(payload as ExerciceBudgetaireCreate, { onSuccess: () => { setFormExercice(undefined); notifySuccess("Exercice cree."); }, onError: notifyError });
  }

  const validatedBudgetsByExercice = useMemo(() => {
    const grouped = new Map<number, Budget[]>();
    for (const budget of validatedBudgetsQuery.data ?? []) {
      const budgets = grouped.get(budget.exercice_id) ?? [];
      budgets.push(budget);
      grouped.set(budget.exercice_id, budgets);
    }
    return grouped;
  }, [validatedBudgetsQuery.data]);

  const columns: DataTableColumn<ExerciceBudgetaire>[] = [
    { key: "libelle", label: "Exercice", render: (exercice) => <span className="font-semibold text-slate-950">{exercice.libelle}</span> },
    { key: "dates", label: "Periode", render: (exercice) => `${exercice.date_debut} au ${exercice.date_fin}` },
    { key: "statut", label: "Statut", render: (exercice) => <StatusBadge status={exercice.statut} /> },
    {
      key: "budgets-valides",
      label: "Budgets valides",
      render: (exercice) => {
        const budgets = validatedBudgetsByExercice.get(exercice.id) ?? [];
        if (validatedBudgetsQuery.isLoading) {
          return <span className="text-slate-500">Chargement...</span>;
        }
        if (budgets.length === 0) {
          return <span className="text-slate-500">Aucun budget valide</span>;
        }
        return (
          <div className="grid gap-2">
            {budgets.map((budget) => (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2" key={budget.id}>
                <p className="font-semibold text-emerald-900">{budget.reference}</p>
                <p className="text-xs text-emerald-700">{budget.libelle}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-800">{formatAmount(Number(budget.montant_total_prevu ?? 0))}</p>
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  if (exercicesQuery.isLoading) {
    return <LoadingState />;
  }

  if (exercicesQuery.isError) {
    return <InlineError message={getApiErrorMessage(exercicesQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader buttonLabel="Ajouter un exercice" subtitle="Ouverture, cloture et suivi de l'exercice actif." title="Gestion des exercices budgetaires" onAdd={() => setFormExercice(null)} />
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800">
        Exercice actif: <span className="font-semibold">{activeQuery.data?.libelle ?? "Aucun exercice ouvert"}</span>
      </div>
      <PopupModal open={formExercice !== undefined} title={formExercice ? "Modifier l'exercice" : "Nouvel exercice budgetaire"} onClose={() => setFormExercice(undefined)}>
        <ExerciceBudgetaireForm exercice={formExercice ?? undefined} loading={createExercice.isPending || updateExercice.isPending} onCancel={() => setFormExercice(undefined)} onSubmit={submitForm} />
      </PopupModal>
      <DataTable
        columns={columns}
        data={exercicesQuery.data ?? []}
        emptyMessage="Aucun exercice trouve."
        getRowKey={(exercice) => exercice.id}
        actions={(exercice) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => setFormExercice(exercice)}>Modifier</button>
            <button
              className="text-sm font-semibold text-amber-600 hover:text-amber-800"
              onClick={() => (exercice.statut === "ouvert" ? closeExercice.mutate(exercice.id, { onSuccess: () => notifySuccess("Exercice cloture."), onError: notifyError }) : openExercice.mutate(exercice.id, { onSuccess: () => notifySuccess("Exercice ouvert."), onError: notifyError }))}
            >
              {exercice.statut === "ouvert" ? "Cloturer" : "Ouvrir"}
            </button>
            <button className="text-sm font-semibold text-rose-600 hover:text-rose-800" onClick={() => setDeleteTarget(exercice)}>Supprimer</button>
          </div>
        )}
      />
      <ConfirmModal
        confirmLabel="Supprimer"
        loading={deleteExercice.isPending}
        message={`Supprimer l'exercice ${deleteTarget?.libelle ?? ""} ?`}
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteExercice.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); notifySuccess("Exercice supprime."); }, onError: notifyError })}
      />
    </div>
  );
}
