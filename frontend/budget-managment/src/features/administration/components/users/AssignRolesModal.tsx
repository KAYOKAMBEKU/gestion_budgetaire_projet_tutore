import { useState } from "react";
import type { Role } from "../../../../types/role";
import type { User } from "../../../../types/user";

interface AssignRolesModalProps {
  user: User;
  roles: Role[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (roleIds: number[]) => void;
}

export function AssignRolesModal({ user, roles, loading, onClose, onSubmit }: AssignRolesModalProps) {
  const [roleIds, setRoleIds] = useState<number[]>(user.roles?.map((role) => role.id) ?? []);

  function toggleRole(id: number) {
    setRoleIds((current) => (current.includes(id) ? current.filter((roleId) => roleId !== id) : [...current, id]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F3D5E]/45 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 text-left shadow-xl">
        <h2 className="text-lg font-semibold text-[#1F2937]">Assigner des roles</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{user.email}</p>
        <div className="mt-4 grid gap-2">
          {roles.map((role) => (
            <label className="flex items-center gap-3 rounded-md border border-[#E5E7EB] px-3 py-2 text-sm" key={role.id}>
              <input checked={roleIds.includes(role.id)} type="checkbox" onChange={() => toggleRole(role.id)} />
              <span className="font-medium text-[#1F2937]">{role.nom_role}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary rounded-md px-4 py-2 text-sm font-medium" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={loading} onClick={() => onSubmit(roleIds)}>
            {loading ? "Assignation..." : "Assigner"}
          </button>
        </div>
      </div>
    </div>
  );
}
