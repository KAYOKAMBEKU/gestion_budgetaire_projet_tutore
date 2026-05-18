import { useDepartements } from "../hooks/useDepartements";
import { useActiveExerciceBudgetaire, useExercicesBudgetaires } from "../hooks/useExercicesBudgetaires";
import { useRoles } from "../hooks/useRoles";
import { useUsers } from "../hooks/useUsers";
import { StatusBadge } from "./StatusBadge";

export function Dashboard() {
  const usersQuery = useUsers();
  const rolesQuery = useRoles();
  const departementsQuery = useDepartements();
  const exercicesQuery = useExercicesBudgetaires();
  const activeExerciceQuery = useActiveExerciceBudgetaire();

  const stats = [
    { label: "Utilisateurs", value: usersQuery.data?.length ?? 0 },
    { label: "Roles", value: rolesQuery.data?.length ?? 0 },
    { label: "Departements", value: departementsQuery.data?.length ?? 0 },
    { label: "Exercices", value: exercicesQuery.data?.length ?? 0 },
  ];

  return (
    <div className="grid gap-5 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Synthese rapide de l'espace administrateur.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={stat.label}>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Exercice actif</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">{activeExerciceQuery.data?.libelle ?? "Aucun exercice ouvert"}</h3>
            {activeExerciceQuery.data ? (
              <p className="mt-1 text-sm text-slate-500">
                {activeExerciceQuery.data.date_debut} au {activeExerciceQuery.data.date_fin}
              </p>
            ) : null}
          </div>
          {activeExerciceQuery.data ? <StatusBadge status={activeExerciceQuery.data.statut} /> : null}
        </div>
      </div>
    </div>
  );
}
