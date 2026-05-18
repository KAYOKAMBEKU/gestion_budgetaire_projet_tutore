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
    { key: "nom", label: "Departement", render: (departement) => <div><p className="font-semibold text-slate-950">{departement.nom}</p><p className="text-xs text-slate-500">{departement.description || "Sans description"}</p></div> },
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
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => setFormDepartement(departement)}>Modifier</button>
            <button
              className="text-sm font-semibold text-amber-600 hover:text-amber-800"
              onClick={() => (departement.statut === "actif" ? deactivateDepartement.mutate(departement.id, { onSuccess: () => notifySuccess("Departement desactive."), onError: notifyError }) : activateDepartement.mutate(departement.id, { onSuccess: () => notifySuccess("Departement active."), onError: notifyError }))}
            >
              {departement.statut === "actif" ? "Desactiver" : "Activer"}
            </button>
            <button className="text-sm font-semibold text-rose-600 hover:text-rose-800" onClick={() => setDeleteTarget(departement)}>Supprimer</button>
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
