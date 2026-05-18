import { StatusBadge } from "../StatusBadge";
import type { User } from "../../../../types/user";

export function UserDetails({ user }: { user: User }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">
            {user.prenom} {user.nom}
          </h3>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <StatusBadge status={user.statut} />
      </div>
      <p className="mt-3 text-sm text-slate-600">Roles: {user.roles?.map((role) => role.nom_role).join(", ") || "Aucun role"}</p>
    </div>
  );
}
