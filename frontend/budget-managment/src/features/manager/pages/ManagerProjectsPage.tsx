import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getApiErrorMessage } from "../../../api/client";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { ProjectTable } from "../components/ProjectTable";
import { useManagerProjects } from "../hooks/useManagerProjects";
import { Navigate } from "react-router-dom";
import { useAssignChefProjet, useAvailableChefsProjet, useChefsProjetByDepartement, useRemoveChefProjet } from "../hooks/useDepartements";

function AccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F7FA] p-6">
      <div className="max-w-lg rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
        <h1 className="text-xl font-bold text-[#1F2937]">{title}</h1>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
      </div>
    </main>
  );
}

export function ManagerProjectsPage() {
  const { authLoading, currentUser, isAuthenticated, isManager } = useAuth();
  const [selectedChefId, setSelectedChefId] = useState<number | "">("");
  const projectsQuery = useManagerProjects(currentUser?.departement_id);
  const chefsQuery = useChefsProjetByDepartement(currentUser?.departement_id);
  const availableChefsQuery = useAvailableChefsProjet(currentUser?.departement_id);
  const assignChef = useAssignChefProjet(currentUser?.departement_id);
  const removeChef = useRemoveChefProjet(currentUser?.departement_id);
  const unassignedProjects = (projectsQuery.data ?? []).filter((project) => !project.chef_projet_id);
  const assignedChefIds = new Set((chefsQuery.data ?? []).map((user) => user.id));
  const availableChefs = (availableChefsQuery.data ?? []).filter((user) => !assignedChefIds.has(user.id));

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au gestionnaire budgetaire." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6">
          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Supervision des projets</p>
                <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">Projets du département</h1>
                <p className="mt-2 text-sm text-[#6B7280]">Consultez et supervisez les projets de votre département.</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#15803D]">Chefs de projet du departement</p>
                <h2 className="mt-2 text-xl font-bold text-[#1F2937]">Affectations</h2>
                <p className="mt-2 text-sm text-[#6B7280]">Affectez un utilisateur ayant le role Chef de projet a votre departement.</p>
              </div>
              <div className="flex min-w-0 flex-col gap-2 sm:min-w-96 sm:flex-row">
                <select
                  className="min-w-0 flex-1 rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#1F2937]"
                  disabled={availableChefsQuery.isLoading || assignChef.isPending}
                  value={selectedChefId}
                  onChange={(event) => setSelectedChefId(event.target.value ? Number(event.target.value) : "")}
                >
                  <option value="">{availableChefsQuery.isLoading ? "Chargement..." : "Choisir un Chef de projet"}</option>
                  {availableChefs.map((user) => (
                    <option key={user.id} value={user.id}>
                      {`${user.prenom ?? ""} ${user.nom}`.trim()} - {user.email}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-primary rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-[#166F48] disabled:opacity-60"
                  disabled={!selectedChefId || assignChef.isPending || !currentUser?.departement_id}
                  onClick={() =>
                    assignChef.mutate(selectedChefId as number, {
                      onSuccess: () => setSelectedChefId(""),
                    })
                  }
                >
                  Affecter
                </button>
              </div>
            </div>

            {assignChef.isError ? <p className="mt-3 text-sm font-semibold text-[#DC2626]">{getApiErrorMessage(assignChef.error)}</p> : null}
            {removeChef.isError ? <p className="mt-3 text-sm font-semibold text-[#DC2626]">{getApiErrorMessage(removeChef.error)}</p> : null}
            {availableChefsQuery.isError ? <p className="mt-3 text-sm font-semibold text-[#DC2626]">{getApiErrorMessage(availableChefsQuery.error)}</p> : null}

            <div className="mt-4 overflow-hidden border border-[#E5E7EB]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Nom</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Email</th>
                    <th className="px-4 py-3 font-semibold text-[#374151]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chefsQuery.isLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-[#6B7280]" colSpan={3}>Chargement...</td>
                    </tr>
                  ) : (chefsQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-[#6B7280]" colSpan={3}>Aucun Chef de projet affecte a ce departement.</td>
                    </tr>
                  ) : (
                    (chefsQuery.data ?? []).map((user) => (
                      <tr key={user.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">{`${user.prenom ?? ""} ${user.nom}`.trim()}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{user.email}</td>
                        <td className="px-4 py-3">
                          <button
                            className="text-sm font-semibold text-[#DC2626] hover:text-[#B91C1C] disabled:opacity-60"
                            disabled={removeChef.isPending}
                            onClick={() => removeChef.mutate(user.id)}
                          >
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <ProjectTable projects={unassignedProjects} loading={projectsQuery.isLoading} />
        </div>
      </div>
    </main>
  );
}

export function ManagerProjectsIndexRedirect() {
  return <Navigate replace to="/manager/projects" />;
}
