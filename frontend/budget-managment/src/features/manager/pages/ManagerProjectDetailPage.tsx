import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ManagerSidebar } from "../components/ManagerSidebar";
import { ProjectStatusBadge } from "../components/ProjectStatusBadge";
import { ValidateProjectModal } from "../components/ValidateProjectModal";
import { RejectProjectModal } from "../components/RejectProjectModal";
import { useProject, useValidateProject, useRejectProject } from "../hooks/useManagerProjects";

function AccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="max-w-lg rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </main>
  );
}

export function ManagerProjectDetailPage() {
  const { authLoading, isAuthenticated, isManager } = useAuth();
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : undefined;
  const projectQuery = useProject(projectId);
  const validateMutation = useValidateProject();
  const rejectMutation = useRejectProject();

  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-600">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au gestionnaire budgetaire." title="Acces refuse" />;
  }

  if (projectQuery.isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 lg:flex">
        <ManagerSidebar />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid min-h-96 place-items-center">
            <p className="text-sm font-semibold text-slate-600">Chargement du projet...</p>
          </div>
        </div>
      </main>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <AccessMessage message="Le projet demande n'a pas pu etre charge." title="Erreur" />;
  }

  const project = projectQuery.data;

  const handleValidate = async () => {
    try {
      await validateMutation.mutateAsync(project.id);
      setIsValidateModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(project.id);
      setIsRejectModalOpen(false);
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
    }
  };

  const canValidate = project.statut === "soumis";
  const canReject = ["soumis", "approuve"].includes(project.statut);

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/manager/projects"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              ← Retour à la liste
            </Link>
          </div>

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-950">{project.titre}</h1>
                  <ProjectStatusBadge status={project.statut} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{project.code}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Description</h3>
                <p className="mt-2 text-slate-950">{project.description || "Aucune description"}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Résultat attendu</h3>
                <p className="mt-2 text-slate-950">{project.resultat_attendu || "Aucun résultat attendu défini"}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Chef de projet</h3>
                <p className="mt-2 text-slate-950">
                  {project.chef_projet ? `${project.chef_projet.prenom} ${project.chef_projet.nom}` : "Non assigné"}
                </p>
                {project.chef_projet && <p className="text-xs text-slate-600">{project.chef_projet.email}</p>}
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Département</h3>
                <p className="mt-2 text-slate-950">{project.departement?.nom || "Non spécifié"}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Coût estimé</h3>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {project.cout_estime.toLocaleString("fr-FR")} €
                </p>
              </div>

              {project.budget_realise_total !== undefined && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Budget réalisé</h3>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {project.budget_realise_total.toLocaleString("fr-FR")} €
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Date de début prévue</h3>
                <p className="mt-2 text-slate-950">
                  {project.date_debut_prevue
                    ? new Date(project.date_debut_prevue).toLocaleDateString("fr-FR")
                    : "Non spécifiée"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Date de fin prévue</h3>
                <p className="mt-2 text-slate-950">
                  {project.date_fin_prevue
                    ? new Date(project.date_fin_prevue).toLocaleDateString("fr-FR")
                    : "Non spécifiée"}
                </p>
              </div>
            </div>
          </section>

          {(canValidate || canReject) && (
            <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-4 text-lg font-bold text-slate-950">Actions</h3>
              <div className="flex flex-wrap gap-3">
                {canValidate && (
                  <button
                    className="rounded-md bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    onClick={() => setIsValidateModalOpen(true)}
                    disabled={validateMutation.isPending}
                  >
                    {validateMutation.isPending ? "Validation en cours..." : "Valider le projet"}
                  </button>
                )}
                {canReject && (
                  <button
                    className="rounded-md bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? "Rejet en cours..." : "Rejeter le projet"}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <ValidateProjectModal
        isOpen={isValidateModalOpen}
        projectTitle={project.titre}
        isSubmitting={validateMutation.isPending}
        onConfirm={handleValidate}
        onCancel={() => setIsValidateModalOpen(false)}
      />

      <RejectProjectModal
        isOpen={isRejectModalOpen}
        projectTitle={project.titre}
        isSubmitting={rejectMutation.isPending}
        onConfirm={handleReject}
        onCancel={() => setIsRejectModalOpen(false)}
      />
    </main>
  );
}
