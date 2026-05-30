import { StatusBadge } from "../StatusBadge";
import type { User } from "../../../../types/user";

export function UserDetails({ user }: { user: User }) {
  return (
    <div className="rounded-lg border border-[#1F2937]/50 bg-white/30 p-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#1F2937]">
            {user.prenom} {user.nom}
          </h3>
          <p className="text-sm text-[#6B7280]">{user.email}</p>
        </div>
        <StatusBadge status={user.statut} />
      </div>
      <p className="mt-3 text-sm text-[#6B7280]">Roles: {user.roles?.map((role) => role.nom_role).join(", ") || "Aucun role"}</p>
    </div>
  );
}
