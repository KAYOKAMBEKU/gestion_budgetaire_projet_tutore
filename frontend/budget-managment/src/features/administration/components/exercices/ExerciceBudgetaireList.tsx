import { useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../../api/client";
import { PopupModal } from "../../../../components/ui/PopupModal";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import type { Budget } from "../../../../types/budget";
import type { ExerciceBudgetaire, ExerciceBudgetaireCreate, ExerciceBudgetaireUpdate } from "../../../../types/exerciceBudgetaire";
import { formatDateRange } from "../../../../utils/formatDate";
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
import { ActionIconButton, EditIcon, SuccessIcon, ToggleIcon, TrashIcon, WarningIcon } from "../ActionIconButton";
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

  function openSelectedExercice(exercice: ExerciceBudgetaire) {
    if (activeQuery.data && activeQuery.data.id !== exercice.id) {
      notifyError(new Error("Impossible d'ouvrir cet exercice : un autre exercice budgetaire est deja ouvert."));
      return;
    }
    openExercice.mutate(exercice.id, { onSuccess: () => notifySuccess("Exercice ouvert."), onError: notifyError });
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
    { key: "libelle", label: "Exercice", render: (exercice) => <span className="font-semibold text-[#1F2937]">{exercice.libelle}</span> },
    { key: "dates", label: "Periode", render: (exercice) => formatDateRange(exercice.date_debut, exercice.date_fin) },
    { key: "statut", label: "Statut", render: (exercice) => <StatusBadge status={exercice.statut} /> },
    {
      key: "budgets-valides",
      label: "Budgets valides",
      render: (exercice) => {
        const budgets = validatedBudgetsByExercice.get(exercice.id) ?? [];
        if (validatedBudgetsQuery.isLoading) {
          return <span className="text-[#6B7280]">Chargement...</span>;
        }
        if (budgets.length === 0) {
          return <span className="text-[#6B7280]">Aucun budget valide</span>;
        }
        return (
          <div className="grid gap-2">
            {budgets.map((budget) => (
              <div className="rounded-md border border-[#BBF7D0] bg-[#DCFCE7] px-3 py-2" key={budget.id}>
                <p className="font-semibold text-[#15803D]">{budget.reference}</p>
                <p className="text-xs text-[#15803D]">{budget.libelle}</p>
                <p className="mt-1 text-xs font-semibold text-[#15803D]">{formatAmount(Number(budget.montant_total_prevu ?? 0))}</p>
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
    <div className="grid gap-5 pb-28">
      <SectionHeader buttonLabel="Ajouter un exercice" subtitle="Ouverture, cloture et suivi de l'exercice actif." title="Gestion des exercices budgetaires" onAdd={() => setFormExercice(null)} />
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
            <ActionIconButton className="text-blue-600 hover:text-[#1D4ED8]" label="Modifier l'exercice" onClick={() => setFormExercice(exercice)}>
              <EditIcon />
            </ActionIconButton>
            <ActionIconButton
              className="text-amber-600 hover:text-[#92400E]"
              disabled={exercice.statut !== "ouvert" && Boolean(activeQuery.data && activeQuery.data.id !== exercice.id)}
              label={
                exercice.statut !== "ouvert" && activeQuery.data && activeQuery.data.id !== exercice.id
                  ? "Impossible d'ouvrir cet exercice : un autre exercice budgetaire est deja ouvert."
                  : exercice.statut === "ouvert"
                    ? "Cloturer l'exercice"
                    : "Ouvrir l'exercice"
              }
              onClick={() => (exercice.statut === "ouvert" ? closeExercice.mutate(exercice.id, { onSuccess: () => notifySuccess("Exercice cloture."), onError: notifyError }) : openSelectedExercice(exercice))}
            >
              <ToggleIcon active={exercice.statut === "ouvert"} />
            </ActionIconButton>
            <ActionIconButton className="text-[#DC2626] hover:text-[#B91C1C]" label="Supprimer l'exercice" onClick={() => setDeleteTarget(exercice)}>
              <TrashIcon />
            </ActionIconButton>
          </div>
        )}
      />
      <footer className="fixed inset-x-4 bottom-4 z-30 flex flex-col gap-3 rounded-lg bg-white/30 px-4 py-3 text-sm shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between lg:left-[19rem] lg:right-8">
        <div className="flex items-center gap-3 text-[#15803D]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#DCFCE7]">
            <SuccessIcon />
          </span>
          <p>
            Exercice actif: <span className="font-semibold">{activeQuery.data?.libelle ?? "Aucun exercice ouvert"}</span>
          </p>
        </div>
        {activeQuery.data ? (
          <div className="flex items-center gap-3 text-[#92400E]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FEF3C7]">
              <WarningIcon />
            </span>
            <p className="font-medium">Impossible d'ouvrir un autre exercice tant que {activeQuery.data.libelle} est ouvert.</p>
          </div>
        ) : null}
      </footer>
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
