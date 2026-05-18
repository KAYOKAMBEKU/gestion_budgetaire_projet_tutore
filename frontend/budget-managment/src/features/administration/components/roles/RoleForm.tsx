import { useState, type FormEvent } from "react";
import { FormShell, inputClass, labelClass } from "../FormShell";
import type { Permission } from "../../../../types/permission";
import type { Role, RoleCreate, RoleUpdate } from "../../../../types/role";

interface RoleFormProps {
  role?: Role;
  permissions: Permission[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: RoleCreate | RoleUpdate) => void;
}

export function RoleForm({ role, permissions, loading, onCancel, onSubmit }: RoleFormProps) {
  const [nomRole, setNomRole] = useState(role?.nom_role ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissionIds, setPermissionIds] = useState<number[]>(role?.permissions?.map((permission) => permission.id) ?? []);
  const isEditing = Boolean(role);

  function togglePermission(id: number) {
    setPermissionIds((current) => (current.includes(id) ? current.filter((permissionId) => permissionId !== id) : [...current, id]));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nomRole.trim()) {
      return;
    }
    onSubmit({ nom_role: nomRole, description: description || undefined, permission_ids: permissionIds });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormShell loading={loading} onCancel={onCancel} submitLabel={isEditing ? "Modifier" : "Creer"} title={isEditing ? "Modifier le role" : "Nouveau role"}>
        <label className={labelClass}>
          Nom du role *
          <input className={inputClass} required value={nomRole} onChange={(event) => setNomRole(event.target.value)} />
        </label>
        <label className={labelClass}>
          Description
          <textarea className={inputClass} rows={3} value={description ?? ""} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <div>
          <p className={labelClass}>Permissions</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {permissions.map((permission) => (
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" key={permission.id}>
                <input checked={permissionIds.includes(permission.id)} type="checkbox" onChange={() => togglePermission(permission.id)} />
                {permission.code}
              </label>
            ))}
          </div>
        </div>
      </FormShell>
    </form>
  );
}
