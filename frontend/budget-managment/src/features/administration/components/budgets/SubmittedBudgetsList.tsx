import { useState } from "react";
import { getApiErrorMessage } from "../../../../api/client";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import type { Budget } from "../../../../types/budget";
import { formatAmount } from "../../../manager/utils/formatAmount";
import { ConfirmModal } from "../ConfirmModal";
import { DataTable, type DataTableColumn } from "../DataTable";
import { InlineError, LoadingState, SectionHeader } from "../SectionHeader";
import { StatusBadge } from "../StatusBadge";
import { useApproveBudget, useRejectBudget, useSubmittedBudgets } from "../../hooks/useBudgetValidation";

type ValidationAction = "approve" | "reject";

interface ValidationTarget {
  budget: Budget;
  action: ValidationAction;
}

export function SubmittedBudgetsList() {
  const dispatch = useAppDispatch();
  const budgetsQuery = useSubmittedBudgets();
  const approveBudget = useApproveBudget();
  const rejectBudget = useRejectBudget();
  const [target, setTarget] = useState<ValidationTarget | null>(null);

  function notifySuccess(message: string) {
    dispatch(showToast({ message, type: "success" }));
  }

  function notifyError(error: unknown) {
    dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
  }

  function confirmAction() {
    if (!target) {
      return;
    }

    if (target.action === "approve") {
      approveBudget.mutate(target.budget.id, {
        onSuccess: () => {
          setTarget(null);
          notifySuccess("Budget valide avec succes.");
        },
        onError: notifyError,
      });
      return;
    }

    rejectBudget.mutate(target.budget.id, {
      onSuccess: () => {
        setTarget(null);
        notifySuccess("Budget rejete avec succes.");
      },
      onError: notifyError,
    });
  }

  const columns: DataTableColumn<Budget>[] = [
    {
      key: "budget",
      label: "Budget",
      render: (budget) => (
        <div>
          <p className="font-semibold text-slate-950">{budget.reference}</p>
          <p className="text-xs text-slate-500">{budget.libelle}</p>
        </div>
      ),
    },
    {
      key: "departement",
      label: "Departement",
      render: (budget) => budget.departement_id,
    },
    {
      key: "montant",
      label: "Montant prevu",
      render: (budget) => formatAmount(Number(budget.montant_total_prevu ?? 0)),
    },
    {
      key: "statut",
      label: "Statut",
      render: (budget) => <StatusBadge status={budget.statut === "soumis" ? "En attente de validation" : budget.statut} />,
    },
  ];

  if (budgetsQuery.isLoading) {
    return <LoadingState />;
  }

  if (budgetsQuery.isError) {
    return <InlineError message={getApiErrorMessage(budgetsQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        buttonLabel="Actualiser"
        subtitle="Budgets soumis par les departements, en attente de decision administrateur."
        title="Validation des budgets soumis"
        onAdd={() => void budgetsQuery.refetch()}
      />
      <DataTable
        columns={columns}
        data={budgetsQuery.data ?? []}
        emptyMessage="Aucun budget soumis en attente de validation."
        getRowKey={(budget) => budget.id}
        actions={(budget) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="text-sm font-semibold text-emerald-700 hover:text-emerald-900" onClick={() => setTarget({ budget, action: "approve" })}>
              Valider
            </button>
            <button className="text-sm font-semibold text-rose-600 hover:text-rose-800" onClick={() => setTarget({ budget, action: "reject" })}>
              Rejeter
            </button>
          </div>
        )}
      />
      <ConfirmModal
        confirmLabel={target?.action === "approve" ? "Valider" : "Rejeter"}
        loading={approveBudget.isPending || rejectBudget.isPending}
        message={
          target?.action === "approve"
            ? `Valider le budget ${target.budget.reference} ?`
            : `Rejeter le budget ${target?.budget.reference ?? ""} ?`
        }
        open={Boolean(target)}
        title={target?.action === "approve" ? "Confirmer la validation" : "Confirmer le rejet"}
        onCancel={() => setTarget(null)}
        onConfirm={confirmAction}
      />
    </div>
  );
}
