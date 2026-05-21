import { Link } from "react-router-dom";
import type { Projet } from "../../../types/projet";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

interface ProjectTableProps {
  projects: Projet[];
  loading?: boolean;
}

export function ProjectTable({ projects, loading }: ProjectTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-sm font-semibold text-slate-600">Chargement des projets...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
        <p className="text-sm font-semibold text-slate-600">Aucun projet trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 font-semibold text-slate-700">Code</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Titre</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Chef de projet</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Coût estimé</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Statut</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Date début</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{project.code}</td>
              <td className="px-4 py-3">
                <div className="max-w-xs truncate text-slate-950">{project.titre}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-slate-600">
                  {project.chef_projet ? `${project.chef_projet.prenom} ${project.chef_projet.nom}` : "-"}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-950">{project.cout_estime.toLocaleString("fr-FR")} €</div>
              </td>
              <td className="px-4 py-3">
                <ProjectStatusBadge status={project.statut} />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {project.date_debut_prevue ? new Date(project.date_debut_prevue).toLocaleDateString("fr-FR") : "-"}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/manager/projects/${project.id}`}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Détails
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
