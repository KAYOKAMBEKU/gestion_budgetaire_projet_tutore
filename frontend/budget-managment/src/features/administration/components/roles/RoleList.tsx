import { useState } from "react";
import { getApiErrorMessage } from "../../../../api/client";
import { PopupModal } from "../../../../components/ui/PopupModal";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import type { Role, RoleCreate, RoleUpdate } from "../../../../types/role";
import { usePermissions } from "../../hooks/usePermissions";
import { useAssignPermissionsToRole, useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "../../hooks/useRoles";
import { ConfirmModal } from "../ConfirmModal";
import { DataTable, type DataTableColumn } from "../DataTable";
import { InlineError, LoadingState, SectionHeader } from "../SectionHeader";
import { AssignPermissionsModal } from "./AssignPermissionsModal";
import { RoleForm } from "./RoleForm";

export function RoleList() {
  const dispatch = useAppDispatch();
  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignPermissions = useAssignPermissionsToRole();
  const [formRole, setFormRole] = useState<Role | null>();
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [assignTarget, setAssignTarget] = useState<Role | null>(null);

  const permissions = permissionsQuery.data ?? [];

  function notifySuccess(message: string) {
    dispatch(showToast({ message, type: "success" }));
  }

  function notifyError(error: unknown) {
    dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
  }

  function submitForm(payload: RoleCreate | RoleUpdate) {
    if (formRole) {
      updateRole.mutate({ id: formRole.id, payload: payload as RoleUpdate }, { onSuccess: () => { setFormRole(undefined); notifySuccess("Role modifie."); }, onError: notifyError });
      return;
    }
    createRole.mutate(payload as RoleCreate, { onSuccess: () => { setFormRole(undefined); notifySuccess("Role cree."); }, onError: notifyError });
  }

  const columns: DataTableColumn<Role>[] = [
    { key: "role", label: "Role", render: (role) => <div><p className="font-semibold text-slate-950">{role.nom_role}</p><p className="text-xs text-slate-500">{role.description || "Sans description"}</p></div> },
    { key: "permissions", label: "Permissions", render: (role) => role.permissions?.map((permission) => permission.code).join(", ") || "Aucune permission" },
  ];

  if (rolesQuery.isLoading) {
    return <LoadingState />;
  }

  if (rolesQuery.isError) {
    return <InlineError message={getApiErrorMessage(rolesQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader buttonLabel="Ajouter un role" subtitle="Creation des roles et affectation des permissions." title="Gestion des roles" onAdd={() => setFormRole(null)} />
      <PopupModal open={formRole !== undefined} title={formRole ? "Modifier le role" : "Nouveau role"} onClose={() => setFormRole(undefined)}>
        <RoleForm loading={createRole.isPending || updateRole.isPending} permissions={permissions} role={formRole ?? undefined} onCancel={() => setFormRole(undefined)} onSubmit={submitForm} />
      </PopupModal>
      <DataTable
        columns={columns}
        data={rolesQuery.data ?? []}
        emptyMessage="Aucun role trouve."
        getRowKey={(role) => role.id}
        actions={(role) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => setFormRole(role)}>Modifier</button>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" onClick={() => setAssignTarget(role)}>Permissions</button>
            <button className="text-sm font-semibold text-rose-600 hover:text-rose-800" onClick={() => setDeleteTarget(role)}>Supprimer</button>
          </div>
        )}
      />
      {assignTarget ? (
        <AssignPermissionsModal
          loading={assignPermissions.isPending}
          permissions={permissions}
          role={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSubmit={(permissionIds) => assignPermissions.mutate({ id: assignTarget.id, permissionIds }, { onSuccess: () => { setAssignTarget(null); notifySuccess("Permissions assignees."); }, onError: notifyError })}
        />
      ) : null}
      <ConfirmModal
        confirmLabel="Supprimer"
        loading={deleteRole.isPending}
        message={`Supprimer le role ${deleteTarget?.nom_role ?? ""} ?`}
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteRole.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); notifySuccess("Role supprime."); }, onError: notifyError })}
      />
    </div>
  );
}
