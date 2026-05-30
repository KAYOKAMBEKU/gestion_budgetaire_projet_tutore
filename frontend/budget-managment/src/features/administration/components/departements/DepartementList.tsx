import { useState } from "react";
import { getApiErrorMessage } from "../../../../api/client";
import { PopupModal } from "../../../../components/ui/PopupModal";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import type { Departement, DepartementCreate, DepartementUpdate } from "../../../../types/departement";
import {
  useActivateDepartement,
  useCreateDepartement,
  useDeactivateDepartement,
  useDeleteDepartement,
  useDepartements,
  useUpdateDepartement,
} from "../../hooks/useDepartements";
import { ActionIconButton, EditIcon, ToggleIcon, TrashIcon } from "../ActionIconButton";
import { ConfirmModal } from "../ConfirmModal";
import { DataTable, type DataTableColumn } from "../DataTable";
import { InlineError, LoadingState, SectionHeader } from "../SectionHeader";
import { StatusBadge } from "../StatusBadge";
import { DepartementForm } from "./DepartementForm";

export function DepartementList() {
  const dispatch = useAppDispatch();
  const departementsQuery = useDepartements();
  const createDepartement = useCreateDepartement();
  const updateDepartement = useUpdateDepartement();
  const deleteDepartement = useDeleteDepartement();
  const activateDepartement = useActivateDepartement();
  const deactivateDepartement = useDeactivateDepartement();
  const [formDepartement, setFormDepartement] = useState<Departement | null>();
  const [deleteTarget, setDeleteTarget] = useState<Departement | null>(null);

  function notifySuccess(message: string) {
    dispatch(showToast({ message, type: "success" }));
  }

  function notifyError(error: unknown) {
    dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
  }

  function submitForm(payload: DepartementCreate | DepartementUpdate) {
    if (formDepartement) {
      updateDepartement.mutate({ id: formDepartement.id, payload: payload as DepartementUpdate }, { onSuccess: () => { setFormDepartement(undefined); notifySuccess("Departement modifie."); }, onError: notifyError });
      return;
    }
    createDepartement.mutate(payload as DepartementCreate, { onSuccess: () => { setFormDepartement(undefined); notifySuccess("Departement cree."); }, onError: notifyError });
  }

  const columns: DataTableColumn<Departement>[] = [
    { key: "nom", label: "Departement", render: (departement) => <div><p className="font-semibold text-[#1F2937]">{departement.nom}</p><p className="text-xs text-[#6B7280]">{departement.description || "Sans description"}</p></div> },
    { key: "responsable", label: "Responsable", render: (departement) => departement.responsable || "Non renseigne" },
    { key: "statut", label: "Statut", render: (departement) => <StatusBadge status={departement.statut} /> },
  ];

  if (departementsQuery.isLoading) {
    return <LoadingState />;
  }

  if (departementsQuery.isError) {
    return <InlineError message={getApiErrorMessage(departementsQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader buttonLabel="Ajouter un departement" subtitle="Organisation interne et activation des departements." title="Gestion des departements" onAdd={() => setFormDepartement(null)} />
      <PopupModal open={formDepartement !== undefined} title={formDepartement ? "Modifier le departement" : "Nouveau departement"} onClose={() => setFormDepartement(undefined)}>
        <DepartementForm departement={formDepartement ?? undefined} loading={createDepartement.isPending || updateDepartement.isPending} onCancel={() => setFormDepartement(undefined)} onSubmit={submitForm} />
      </PopupModal>
      <DataTable
        columns={columns}
        data={departementsQuery.data ?? []}
        emptyMessage="Aucun departement trouve."
        getRowKey={(departement) => departement.id}
        actions={(departement) => (
          <div className="flex flex-wrap justify-end gap-2">
            <ActionIconButton className="text-blue-600 hover:text-[#1D4ED8]" label="Modifier le departement" onClick={() => setFormDepartement(departement)}>
              <EditIcon />
            </ActionIconButton>
            <ActionIconButton
              className="text-amber-600 hover:text-[#92400E]"
              label={departement.statut === "actif" ? "Desactiver le departement" : "Activer le departement"}
              onClick={() => (departement.statut === "actif" ? deactivateDepartement.mutate(departement.id, { onSuccess: () => notifySuccess("Departement desactive."), onError: notifyError }) : activateDepartement.mutate(departement.id, { onSuccess: () => notifySuccess("Departement active."), onError: notifyError }))}
            >
              <ToggleIcon active={departement.statut === "actif"} />
            </ActionIconButton>
            <ActionIconButton className="text-[#DC2626] hover:text-[#B91C1C]" label="Supprimer le departement" onClick={() => setDeleteTarget(departement)}>
              <TrashIcon />
            </ActionIconButton>
          </div>
        )}
      />
      <ConfirmModal
        confirmLabel="Supprimer"
        loading={deleteDepartement.isPending}
        message={`Supprimer le departement ${deleteTarget?.nom ?? ""} ?`}
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteDepartement.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); notifySuccess("Departement supprime."); }, onError: notifyError })}
      />
    </div>
  );
}
