import { useState } from "react";
import { getApiErrorMessage } from "../../../../api/client";
import { PopupModal } from "../../../../components/ui/PopupModal";
import { useAppDispatch } from "../../../../store";
import { showToast } from "../../../../store/slices/uiSlice";
import type { Role } from "../../../../types/role";
import type { User, UserCreate, UserUpdate } from "../../../../types/user";
import { ConfirmModal } from "../ConfirmModal";
import { DataTable, type DataTableColumn } from "../DataTable";
import { InlineError, LoadingState, SectionHeader } from "../SectionHeader";
import { StatusBadge } from "../StatusBadge";
import {
  useActivateUser,
  useAssignRolesToUser,
  useCreateUser,
  useDeactivateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "../../hooks/useUsers";
import { useRoles } from "../../hooks/useRoles";
import { AssignRolesModal } from "./AssignRolesModal";
import { UserDetails } from "./UserDetails";
import { UserForm } from "./UserForm";

export function UserList() {
  const dispatch = useAppDispatch();
  const usersQuery = useUsers();
  const rolesQuery = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const assignRoles = useAssignRolesToUser();
  const [formUser, setFormUser] = useState<User | null>();
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [assignTarget, setAssignTarget] = useState<User | null>(null);

  const roles = rolesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  function notifySuccess(message: string) {
    dispatch(showToast({ message, type: "success" }));
  }

  function notifyError(error: unknown) {
    dispatch(showToast({ message: getApiErrorMessage(error), type: "error" }));
  }

  function submitForm(payload: UserCreate | UserUpdate) {
    if (formUser) {
      updateUser.mutate({ id: formUser.id, payload: payload as UserUpdate }, { onSuccess: () => { setFormUser(undefined); notifySuccess("Utilisateur modifie."); }, onError: notifyError });
      return;
    }
    createUser.mutate(payload as UserCreate, { onSuccess: () => { setFormUser(undefined); notifySuccess("Utilisateur cree."); }, onError: notifyError });
  }

  const columns: DataTableColumn<User>[] = [
    { key: "name", label: "Utilisateur", render: (user) => <div><p className="font-semibold text-slate-950">{user.prenom} {user.nom}</p><p className="text-xs text-slate-500">{user.email}</p></div> },
    { key: "status", label: "Statut", render: (user) => <StatusBadge status={user.statut} /> },
    { key: "roles", label: "Roles", render: (user) => user.roles?.map((role) => role.nom_role).join(", ") || "Aucun role" },
  ];

  if (usersQuery.isLoading) {
    return <LoadingState />;
  }

  if (usersQuery.isError) {
    return <InlineError message={getApiErrorMessage(usersQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader buttonLabel="Ajouter un utilisateur" subtitle="Creation, affectation des roles et gestion du statut." title="Gestion des utilisateurs" onAdd={() => setFormUser(null)} />
      <PopupModal
        open={formUser !== undefined}
        title={formUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        onClose={() => setFormUser(undefined)}
      >
        <UserForm loading={createUser.isPending || updateUser.isPending} roles={roles} user={formUser ?? undefined} onCancel={() => setFormUser(undefined)} onSubmit={submitForm} />
      </PopupModal>
      {detailsUser ? <UserDetails user={detailsUser} /> : null}
      <DataTable
        columns={columns}
        data={users}
        emptyMessage="Aucun utilisateur trouve."
        getRowKey={(user) => user.id}
        actions={(user) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="text-sm font-semibold text-slate-600 hover:text-slate-950" onClick={() => setDetailsUser(user)}>Voir</button>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => setFormUser(user)}>Modifier</button>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" onClick={() => setAssignTarget(user)}>Roles</button>
            <button
              className="text-sm font-semibold text-amber-600 hover:text-amber-800"
              onClick={() => (user.statut === "actif" ? deactivateUser.mutate(user.id, { onSuccess: () => notifySuccess("Utilisateur desactive."), onError: notifyError }) : activateUser.mutate(user.id, { onSuccess: () => notifySuccess("Utilisateur active."), onError: notifyError }))}
            >
              {user.statut === "actif" ? "Desactiver" : "Activer"}
            </button>
            <button className="text-sm font-semibold text-rose-600 hover:text-rose-800" onClick={() => setDeleteTarget(user)}>Supprimer</button>
          </div>
        )}
      />
      {assignTarget ? (
        <AssignRolesModal
          loading={assignRoles.isPending}
          roles={roles as Role[]}
          user={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSubmit={(roleIds) => assignRoles.mutate({ id: assignTarget.id, roleIds }, { onSuccess: () => { setAssignTarget(null); notifySuccess("Roles assignes."); }, onError: notifyError })}
        />
      ) : null}
      <ConfirmModal
        confirmLabel="Supprimer"
        loading={deleteUser.isPending}
        message={`Supprimer ${deleteTarget?.email ?? "cet utilisateur"} ?`}
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteUser.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); notifySuccess("Utilisateur supprime."); }, onError: notifyError })}
      />
    </div>
  );
}
