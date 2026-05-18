import { useState } from "react";
import { getApiErrorMessage } from "../../../../api/client";
import { PopupModal } from "../../../../components/ui/PopupModal";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import type { Permission, PermissionCreate, PermissionUpdate } from "../../../../types/permission";
import { useCreatePermission, useDeletePermission, usePermissions, useUpdatePermission } from "../../hooks/usePermissions";
import { ConfirmModal } from "../ConfirmModal";
import { DataTable, type DataTableColumn } from "../DataTable";
import { InlineError, LoadingState, SectionHeader } from "../SectionHeader";
import { PermissionForm } from "./PermissionForm";

export function PermissionList() {
  const dispatch = useAppDispatch();
  const permissionsQuery = usePermissions();
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const deletePermission = useDeletePermission();
  const [formPermission, setFormPermission] = useState<Permission | null>();
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

  function notifySuccess(message: string) {
    dispatch(showToast({ message, type: "success" }));
  }

  function notifyError(error: unknown) {
    dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
  }

  function submitForm(payload: PermissionCreate | PermissionUpdate) {
    if (formPermission) {
      updatePermission.mutate({ id: formPermission.id, payload: payload as PermissionUpdate }, { onSuccess: () => { setFormPermission(undefined); notifySuccess("Permission modifiee."); }, onError: notifyError });
      return;
    }
    createPermission.mutate(payload as PermissionCreate, { onSuccess: () => { setFormPermission(undefined); notifySuccess("Permission creee."); }, onError: notifyError });
  }

  const columns: DataTableColumn<Permission>[] = [
    { key: "code", label: "Code", render: (permission) => <span className="font-semibold text-slate-950">{permission.code}</span> },
    { key: "description", label: "Description", render: (permission) => permission.description || "Sans description" },
  ];

  if (permissionsQuery.isLoading) {
    return <LoadingState />;
  }

  if (permissionsQuery.isError) {
    return <InlineError message={getApiErrorMessage(permissionsQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader buttonLabel="Ajouter une permission" subtitle="Codes uniques utilises pour les autorisations." title="Gestion des permissions" onAdd={() => setFormPermission(null)} />
      <PopupModal open={formPermission !== undefined} title={formPermission ? "Modifier la permission" : "Nouvelle permission"} onClose={() => setFormPermission(undefined)}>
        <PermissionForm loading={createPermission.isPending || updatePermission.isPending} permission={formPermission ?? undefined} onCancel={() => setFormPermission(undefined)} onSubmit={submitForm} />
      </PopupModal>
      <DataTable
        columns={columns}
        data={permissionsQuery.data ?? []}
        emptyMessage="Aucune permission trouvee."
        getRowKey={(permission) => permission.id}
        actions={(permission) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => setFormPermission(permission)}>Modifier</button>
            <button className="text-sm font-semibold text-rose-600 hover:text-rose-800" onClick={() => setDeleteTarget(permission)}>Supprimer</button>
          </div>
        )}
      />
      <ConfirmModal
        confirmLabel="Supprimer"
        loading={deletePermission.isPending}
        message={`Supprimer la permission ${deleteTarget?.code ?? ""} ?`}
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deletePermission.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); notifySuccess("Permission supprimee."); }, onError: notifyError })}
      />
    </div>
  );
}
