import { useState } from "react";
import type { Permission } from "../../../../types/permission";
import type { Role } from "../../../../types/role";

interface AssignPermissionsModalProps {
  role: Role;
  permissions: Permission[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (permissionIds: number[]) => void;
}

export function AssignPermissionsModal({ role, permissions, loading, onClose, onSubmit }: AssignPermissionsModalProps) {
  const [permissionIds, setPermissionIds] = useState<number[]>(role.permissions?.map((permission) => permission.id) ?? []);

  function togglePermission(id: number) {
    setPermissionIds((current) => (current.includes(id) ? current.filter((permissionId) => permissionId !== id) : [...current, id]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 text-left shadow-xl">
        <h2 className="text-lg font-semibold text-slate-950">Assigner des permissions</h2>
        <p className="mt-1 text-sm text-slate-500">{role.nom_role}</p>
        <div className="mt-4 grid max-h-80 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
          {permissions.map((permission) => (
            <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm" key={permission.id}>
              <input checked={permissionIds.includes(permission.id)} type="checkbox" onChange={() => togglePermission(permission.id)} />
              <span className="font-medium text-slate-700">{permission.code}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium" onClick={onClose}>
            Annuler
          </button>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} onClick={() => onSubmit(permissionIds)}>
            {loading ? "Assignation..." : "Assigner"}
          </button>
        </div>
      </div>
    </div>
  );
}
